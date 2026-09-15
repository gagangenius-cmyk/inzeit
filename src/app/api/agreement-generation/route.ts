import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { branchCurrencyError, resolveBranchCurrency } from '@/lib/branchCurrency';
import { renderAgreementForBranch } from '@/lib/renderAgreementForBranch';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { formatDocumentNumber } from '@/lib/documentNumbering';
import { ensureClientActualNameColumn } from '@/lib/ensureClientActualNameColumn';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['agreements.create']);
  if (isAuthError(auth)) return auth;
  await ensureClientActualNameColumn();
  try {
    const body = await request.json();
    const { opportunityId, agreementData, clientData, templateId } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Get opportunity details with client information. The branch join uses
    // the lead's own branch first, falling back to opportunity.branchId only
    // if the lead somehow has none set — a lead-to-opportunity conversion
    // used to stamp the *counselor's* branch onto the opportunity instead of
    // the lead's, so joining on o.branchId alone could still render the
    // agreement (company name, address, licence, governing law) under the
    // wrong branch entirely for any opportunity created before that fix.
    const [opportunityResult] = await sequelize.query(`
      SELECT o.*,
             l.fname, l.lname, l.client_actual_name, l.email, l.mobile, l.phone, l.address, l.nationality,
             l.dob, l.id_number, l.id_expiry, l.service_interest,
             s.name AS service_name, s.validity AS program_validity,
             fe.name as from_employee_name, fe.email as from_employee_email,
             be.name as branch_name, be.address as branch_address, be.abbrv as branch_abbrv,
             COALESCE(l.branch, o.branchId) AS resolvedBranchId
      FROM crm_opportunities o
      LEFT JOIN crm_forum_leads l ON o.leadId = l.id
      LEFT JOIN crm_service s ON s.id = CAST(l.service_interest AS UNSIGNED)
      LEFT JOIN crm_employee fe ON o.assignedTo = fe.id
      LEFT JOIN crm_branch be ON be.id = COALESCE(l.branch, o.branchId)
      WHERE o.id = ?
    `, {
      replacements: [opportunityId]
    });

    if (!opportunityResult || (opportunityResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    const opportunity = (opportunityResult as any[])[0];

    // Branch Manager may only generate an agreement for their own branch's
    // opportunity; CEO is unrestricted.
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      if (opportunity.resolvedBranchId !== undefined && opportunity.resolvedBranchId !== null && Number(opportunity.resolvedBranchId) !== Number(auth.branch || 0)) {
        return NextResponse.json({ success: false, error: 'You can only generate an agreement for an opportunity in your own branch' }, { status: 403 });
      }
    }

    // Duplicate-submission guard: an opportunity only ever has one generated
    // agreement (crm_opportunities.agreementId reflects a single record) - a
    // resubmit (e.g. a double-clicked "Close Won") would otherwise generate
    // a second, competing agreement with a different number.
    if (opportunity.agreementGenerated && opportunity.agreementId) {
      return NextResponse.json(
        { success: false, error: 'An agreement has already been generated for this opportunity.', data: { agreementId: opportunity.agreementId } },
        { status: 409 }
      );
    }

    const branchCurrency = await resolveBranchCurrency(opportunity.resolvedBranchId);
    if (!branchCurrency) {
      return NextResponse.json({ success: false, error: branchCurrencyError(opportunity.resolvedBranchId) }, { status: 422 });
    }
    opportunity.currency = branchCurrency.currencyCode;
    opportunity.branch_name = branchCurrency.branchName;
    opportunity.branch_address = branchCurrency.branchAddress;

    // Agreement expiry defaults to the selected service's own validity period
    // (crm_service.validity, e.g. "18 Months" for Canada/Australia vs "6 Months"
    // for a visit visa) counted from the start date, instead of a flat
    // one-year window that under-counts the longer immigration programs.
    const validityMonths = parseInt(opportunity.program_validity, 10) || 12;
    const agreementStartDate = agreementData?.startDate ? new Date(agreementData.startDate) : new Date();
    const agreementEndDate = agreementData?.endDate
      ? new Date(agreementData.endDate)
      : new Date(agreementStartDate.getFullYear(), agreementStartDate.getMonth() + validityMonths, agreementStartDate.getDate());

    // Placeholder embedded in the rendered content below — reformatted to the
    // final AG/{branch}/{product}/{DDMMYYYY}/{seq} number once this row's own
    // id is known (see the UPDATE right after the INSERT).
    let agreementNumber = `AGR-PENDING-${Date.now()}`;
    // The agreement's stated amount must be the fixed amount the client
    // actually agreed to after any approved discount (agreementData.totalAmount,
    // sent by the quotation/retention flow) — not the opportunity's original
    // pre-discount package/estimated value, which only applies as a fallback
    // when the caller never went through a quotation (no discount to apply).
    const agreementTotalAmount = Number(agreementData?.totalAmount ?? opportunity.estimatedValue ?? 0);
    const agreementContent = generateAgreementContent(opportunity, { ...agreementData, endDate: agreementEndDate, totalAmount: agreementTotalAmount }, agreementNumber);

    // Create agreement record in database
    const [agreementResult] = await sequelize.query(`
      INSERT INTO crm_opportunity_agreements (
        opportunityId, agreementNumber, agreementType, templateId, status,
        title, description, termsAndConditions, totalAmount, currency,
        startDate, endDate, signedDate, clientName, clientEmail, clientPhone,
        companyName, companyAddress, createdBy, uploadedBy, generatedDate,
        content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [
        opportunityId,
        agreementNumber,
        agreementData?.agreementType || 'service_agreement',
        templateId || null,
        'generated',
        agreementData?.title || `Service Agreement - ${opportunity.client_actual_name || `${opportunity.fname} ${opportunity.lname}`}`,
        agreementData?.description || `Service agreement for ${opportunity.serviceType}`,
        agreementData?.terms || generateDefaultTerms(opportunity, agreementTotalAmount),
        agreementTotalAmount,
        branchCurrency.currencyCode,
        agreementStartDate.toISOString().split('T')[0],
        agreementEndDate.toISOString().split('T')[0],
        null, // signedDate
        opportunity.client_actual_name || `${opportunity.fname} ${opportunity.lname}`,
        opportunity.email,
        opportunity.mobile || opportunity.phone,
        clientData?.companyName || '',
        clientData?.companyAddress || opportunity.address,
        opportunity.createdBy || opportunity.assignedTo,
        opportunity.createdBy || opportunity.assignedTo,
        new Date(),
        agreementContent
      ]
    });

    const agreementId = (agreementResult as any).insertId;

    // Reformat now that the row's own auto-increment id is known — the
    // `content` column still has the pending placeholder embedded in its text,
    // but nothing reads that blob for display (see the equivalent comment in
    // lead-to-opportunity/route.ts).
    agreementNumber = formatDocumentNumber({
      prefix: 'AG',
      branchName: branchCurrency.branchName,
      branchAddress: branchCurrency.branchAddress,
      branchAbbrv: branchCurrency.branchAbbrv,
      product: opportunity.serviceType || opportunity.service_interest,
      sequenceId: agreementId,
    });
    await sequelize.query(
      `UPDATE crm_opportunity_agreements SET agreementNumber = ? WHERE id = ?`,
      { replacements: [agreementNumber, agreementId] }
    );

    // Update opportunity status
    await sequelize.query(`
      UPDATE crm_opportunities
      SET agreementGenerated = true, agreementId = ?, updatedAt = NOW()
      WHERE id = ?
    `, {
      replacements: [agreementId, opportunityId]
    });

    // Return the generated agreement
    return NextResponse.json({
      success: true,
      message: 'Agreement generated successfully',
      data: {
        agreementId,
        agreementNumber,
        content: agreementContent,
        opportunity: {
          id: opportunity.id,
          opportunityNumber: opportunity.opportunityNumber,
          clientName: opportunity.client_actual_name || `${opportunity.fname} ${opportunity.lname}`,
          clientEmail: opportunity.email,
          clientPhone: opportunity.mobile || opportunity.phone,
          serviceType: opportunity.serviceType,
          estimatedValue: opportunity.estimatedValue,
          branchName: branchCurrency.branchName,
          currency: branchCurrency.currencyCode,
        }
      }
    });

  } catch (error: any) {
    console.error('Error generating agreement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate agreement: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['agreements.view']);
  if (isAuthError(auth)) return auth;
  await ensureClientActualNameColumn();
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Get agreement details
    const [agreementResult] = await sequelize.query(`
      SELECT a.*, o.opportunityNumber, o.leadId,
             l.fname, l.lname, l.client_actual_name, l.email, l.mobile, l.phone,
             fe.name as assignedEmployeeName
      FROM crm_opportunity_agreements a
      LEFT JOIN crm_opportunities o ON a.opportunityId = o.id
      LEFT JOIN crm_forum_leads l ON o.leadId = l.id
      LEFT JOIN crm_employee fe ON o.assignedTo = fe.id
      WHERE a.opportunityId = ?
      ORDER BY a.createdAt DESC
    `, {
      replacements: [opportunityId]
    });

    if (!agreementResult || (agreementResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No agreements found for this opportunity' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agreementResult
    });

  } catch (error: any) {
    console.error('Error fetching agreement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agreement: ' + error.message },
      { status: 500 }
    );
  }
}

function generateAgreementContent(opportunity: any, agreementData: any, agreementNumber: string): string {
  const currentDate = new Date().toLocaleDateString();

  // Every CRM product now uses the branch's own signed master agreement
  // (the 4 Gulf branches' bilingual "unified terms" contract, or Hyderabad's
  // separate English-only document — see renderAgreementForBranch.ts).
  // Product-specific details are placed in Annexure A instead of changing
  // the legal terms.
  return renderAgreementForBranch(opportunity.branch_abbrv, {
    agreementNumber,
    agreementDate: currentDate,
    agreementExpiry: agreementData?.endDate ? new Date(agreementData.endDate).toLocaleDateString() : '',
    clientName: opportunity.client_actual_name || `${opportunity.fname || ''} ${opportunity.lname || ''}`.trim() || 'Client',
    clientEmail: opportunity.email || '',
    clientPhone: opportunity.mobile || opportunity.phone || '',
    clientAddress: opportunity.address || '',
    nationality: opportunity.nationality || '',
    passportNumber: opportunity.id_number || '',
    idNumber: opportunity.emirates_id || opportunity.id_number || '',
    serviceProgram: agreementData?.serviceProgram || agreementData?.serviceType || opportunity.service_name || opportunity.serviceType || opportunity.serviceRequired || 'Professional Consultancy Services',
    programCode: agreementData?.programCode || opportunity.service_interest || '',
    programTermSchedule: agreementData?.programTermSchedule || opportunity.program_validity || (agreementData?.duration ? `${agreementData.duration} months` : ''),
    destinationCountry: opportunity.country_interest || opportunity.country || '',
    totalAmount: Number(agreementData?.totalAmount ?? opportunity.estimatedValue ?? 0).toLocaleString(),
    initialPayment: Number(agreementData?.initialPayment || agreementData?.firstPayment || 0).toLocaleString(),
    secondPayment: Number(agreementData?.secondPayment || 0).toLocaleString(),
    clientId: String(opportunity.leadId || opportunity.id || ''),
    includedDeliverables: agreementData?.includedDeliverables || agreementData?.title || agreementData?.agreementTitle || '',
    expressExclusions: agreementData?.expressExclusions || '',
    specialTerms: agreementData?.specialTerms || agreementData?.specialConditions || agreementData?.terms || agreementData?.termsAndConditions || '',
  });
}

function generateDefaultTerms(opportunity: any, totalAmount: number): string {
  return `
1. SERVICE PROVISION
   The Service Provider agrees to provide ${opportunity.serviceType} services to the Client as specified in this agreement.

2. CLIENT OBLIGATIONS
   The Client agrees to:
   - Provide all necessary information and documentation required for the services
   - Make timely payments as agreed
   - Cooperate with the Service Provider throughout the process
   - Maintain confidentiality of all information shared

3. SERVICE PROVIDER OBLIGATIONS
   The Service Provider agrees to:
   - Provide professional and timely services
   - Maintain confidentiality of client information
   - Keep the client informed of progress
   - Deliver services as per agreed standards

4. PAYMENT TERMS
   - Total Amount: ${opportunity.currency || 'AED'} ${totalAmount.toLocaleString()}
   - Payment Method: Bank Transfer
   - Payment Schedule: As per agreed schedule
   - Late payments may incur additional charges

5. TERM AND TERMINATION
   - This agreement is valid for the duration specified
   - Either party may terminate with 30 days written notice
   - Termination does not affect obligations accrued prior to termination

6. CONFIDENTIALITY
   - Both parties agree to maintain confidentiality of all information
   - Information shared during the service provision is protected
   - This obligation survives the termination of this agreement

7. GOVERNING LAW
   - This agreement shall be governed by the laws of United Arab Emirates
   - Any disputes shall be resolved through mutual discussion or legal means

8. ENTIRE AGREEMENT
   - This document constitutes the entire agreement between the parties
   - No modifications or amendments shall be valid unless in writing and signed by both parties
   - Both parties acknowledge having read, understood, and agreed to the terms contained herein
  `.trim();
}
