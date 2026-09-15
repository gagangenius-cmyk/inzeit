import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { findProductAgreementTemplate } from '@/lib/productAgreementTemplates';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';

let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

export async function GET(request: NextRequest) {
  try {
    await ensureDB();
    const { searchParams } = new URL(request.url);

    const authorization = request.headers.get('authorization');
    const token = request.cookies.get('auth-token')?.value || authorization?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Authentication is required' }, { status: 401 });
    }
    const currentUserRole = String(currentUser.type || '').toLowerCase().replace(/[\s-]+/g, '_');
    // Case Officer reuses the same case_officer-scoped visibility as Process Coordinator.
    const isProcessCoordinator = ['process_coordinator', 'case_officer'].includes(currentUserRole);
    // CEO/director/founder/super admin/DOS/Director of Operations/Operation
    // Manager/Senior Operation Manager/Audit Manager see every branch's
    // retained clients (per scripts/seed-roles-permissions.js, Audit Manager
    // and Senior Operation Manager are seeded with the exact same permission
    // tier as Operation Manager, so their row-visibility should match too);
    // Process Coordinator/Team Leader/CPO/Assistant Branch Manager/Sr Branch
    // Co-ordinator also get full, unrestricted Operations visibility (not
    // just their own case_officer-assigned cases) per explicit business
    // request; branch manager/FOE are scoped to their own branch; everyone
    // else (counselor, sales agent, etc.) only sees cases they own.
    const canViewAll =
      currentUser.role === 1 ||
      isCeo(currentUser) ||
      [
        'admin', 'administrator', 'super_admin', 'director_of_sales', 'director', 'dos', 'founder',
        'director_of_operations', 'operation_manager', 'senior_operation_manager', 'sr_operation_manager', 'audit_manager',
        // 'team_leader' already covered the post-restructuring Team Leader
        // role by coincidence (it reuses the same type string as the old
        // operations-tier Team Leader this list originally meant) - but
        // 'area_manager' (its sibling manager tier, added by that same
        // restructuring) was missing entirely, silently downgrading it to
        // "own cases only" below instead of company-wide visibility.
        'process_coordinator', 'team_leader', 'area_manager', 'cpo', 'assistant_branch_manager', 'sr_branch_coordinator',
      ].includes(currentUserRole);
    const isBranchScoped = !canViewAll && !isProcessCoordinator && ['branch_manager', 'bm', 'foe'].includes(currentUserRole);
    const search = searchParams.get('search') || '';
    const leadId = searchParams.get('leadId') || '';
    const agreementNumber = searchParams.get('agreementNumber') || '';
    const operationsModule = searchParams.get('module') || '';
    const product = searchParams.get('product') || operationsModule;
    const status = searchParams.get('status') || '';
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1000);

    const productTemplate = findProductAgreementTemplate(product);
    const productTerms = productTemplate
      ? [productTemplate.id, productTemplate.name, ...productTemplate.aliases]
      : product
        ? [product]
        : [];

    const where: string[] = [
      "(LOWER(COALESCE(o.status, '')) = 'won' OR LOWER(COALESCE(o.retentionStatus, '')) = 'approved' OR LOWER(COALESCE(l.status, '')) IN ('retained', 'client', 'converted'))",
    ];
    const replacements: Record<string, unknown> = { limit };

    if (search) {
      where.push(`(
        a.agreementNumber LIKE :search
        OR CAST(l.id AS CHAR) LIKE :search
        OR l.fname LIKE :search
        OR l.lname LIKE :search
        OR l.email LIKE :search
        OR l.mobile LIKE :search
        OR l.phone LIKE :search
        OR o.opportunityName LIKE :search
      )`);
      replacements.search = `%${search}%`;
    }

    if (leadId) {
      where.push('l.id = :leadId');
      replacements.leadId = Number.parseInt(leadId, 10);
    }

    if (agreementNumber) {
      where.push('a.agreementNumber = :agreementNumber');
      replacements.agreementNumber = agreementNumber;
    }

    if (status) {
      where.push('l.status = :status');
      replacements.status = status;
    }

    if (isProcessCoordinator && !canViewAll) {
      where.push('l.case_officer = :caseOfficerId');
      replacements.caseOfficerId = currentUser.id;
    } else if (isBranchScoped) {
      where.push('l.branch = :userBranch');
      replacements.userBranch = currentUser.branch;
    } else if (!canViewAll) {
      where.push('(l.Counsilor = :userId OR l.case_officer = :userId OR o.assignedTo = :userId OR o.createdBy = :userId)');
      replacements.userId = currentUser.id;
    }

    if (productTerms.length > 0) {
      const productConditions = productTerms.map((term, index) => {
        replacements[`product${index}`] = `%${term}%`;
        return `(
          o.serviceType LIKE :product${index}
          OR o.serviceRequired LIKE :product${index}
          OR o.opportunityName LIKE :product${index}
          OR svc.name LIKE :product${index}
          OR a.agreementType LIKE :product${index}
          OR a.title LIKE :product${index}
        )`;
      });
      // A case that has stage data for a program must always appear in that
      // program's list, even when legacy service fields contain numeric IDs.
      const stageCondition = operationsModule
        ? ` OR EXISTS (
            SELECT 1 FROM crm_operation_stage_data osd
            WHERE osd.module = :operationsModule
              AND osd.leadId = l.id
              AND (osd.opportunityId = o.id OR osd.opportunityId IS NULL)
          )`
        : '';
      if (operationsModule) replacements.operationsModule = operationsModule;
      where.push(`(${productConditions.join(' OR ')}${stageCondition})`);
    }

    const rows = await sequelize.query(
      `SELECT
        o.id AS opportunityId,
        o.opportunityNumber,
        o.opportunityName,
        o.serviceType,
        o.serviceRequired,
        o.status AS opportunityStatus,
        o.retentionStatus,
        o.retentionDate,
        o.estimatedValue,
        o.actualValue,
        o.currency,
        l.id AS leadId,
        l.fname,
        l.lname,
        l.email,
        l.mobile,
        l.phone,
        l.dob,
        l.gender,
        l.nationality,
        l.country_interest,
        l.service_interest,
        l.market_source,
        l.type AS leadType,
        l.status AS leadStatus,
        l.branch,
        l.Counsilor,
        l.case_officer,
        counselor.name AS counselorName,
        counselor.cemail AS counselorEmail,
        caseOfficer.name AS caseOfficerName,
        caseOfficer.cemail AS caseOfficerEmail,
        b.branch AS branchName,
        b.abbrv AS branchAbbrv,
        b.address AS branchAddress,
        b.email AS branchEmail,
        b.mobile AS branchMobile,
        a.id AS agreementId,
        a.agreementNumber,
        a.agreementType,
        a.title AS agreementTitle,
        a.status AS agreementStatus,
        a.generatedDate,
        p.id AS latestPaymentId,
        p.paymentNumber,
        p.receiptNumber,
        p.paidAmount,
        p.totalAmount,
        p.status AS paymentStatus
      FROM crm_opportunities o
      INNER JOIN crm_forum_leads l ON l.id = o.leadId
      LEFT JOIN crm_service svc ON svc.id = l.service_interest
      LEFT JOIN crm_employee counselor ON counselor.id = l.Counsilor
      LEFT JOIN crm_employee caseOfficer ON caseOfficer.id = l.case_officer
      LEFT JOIN crm_branch b ON b.id = l.branch
      LEFT JOIN crm_opportunity_agreements a ON a.id = COALESCE(
        o.agreementId,
        (
          SELECT a2.id
          FROM crm_opportunity_agreements a2
          WHERE a2.opportunityId = o.id
          ORDER BY a2.createdAt DESC
          LIMIT 1
        )
      )
      LEFT JOIN crm_opportunity_payments p ON p.id = (
        SELECT p2.id
        FROM crm_opportunity_payments p2
        WHERE p2.opportunityId = o.id
        ORDER BY p2.createdAt DESC
        LIMIT 1
      )
      WHERE ${where.join(' AND ')}
      ORDER BY COALESCE(o.retentionDate, o.updatedAt, o.createdAt) DESC
      LIMIT :limit`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );

    return NextResponse.json({
      success: true,
      product: productTemplate?.id || product || null,
      count: rows.length,
      data: rows,
    });
  } catch (error: any) {
    console.error('Operations search failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search operations clients' },
      { status: 500 }
    );
  }
}
