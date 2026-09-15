import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { models } from '@/models';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      leadData, 
      autoGenerateOpportunity = false,
      opportunityData = {},
      autoGenerateReceipt = false,
      receiptData = {},
      autoGenerateAgreement = false,
      agreementData = {}
    } = data;

    // Step 1: Create the lead
    const lead = await models.CrmcForumLeads.create({
      ...leadData,
      created: new Date(),
      regdate: new Date(),
      regtime: new Date(),
      last_updated: new Date().toLocaleDateString(),
      last_updtd_time: new Date().toTimeString().split(' ')[0],
      stepComplete: autoGenerateOpportunity ? 2 : 1,
      exist: 0,
      status_date: new Date()
    });

    // Reload with associations
    const leadWithRelations = await models.CrmcForumLeads.findByPk(lead.id, {
      include: [
        { association: 'dmEmployeeByASSIGNTo', attributes: ['id', 'name'] },
        { association: 'dmEmployeeByCoUNSILOR', attributes: ['id', 'name'] },
        { association: 'dmBranch', attributes: ['id', 'name'] }
      ]
    });

    let opportunity = null;
    let receipt = null;
    let agreement = null;

    // Step 2: Auto-generate opportunity if requested
    if (autoGenerateOpportunity) {
      opportunity = await models.CrmcOpportunities.create({
        leadId: lead.id,
        opportunityNumber: `OPP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        opportunityName: opportunityData.opportunityName || `${lead.fname} ${lead.lname} - ${lead.service_interest}`,
        opportunityType: 'service',
        description: opportunityData.description || `Opportunity created for lead: ${lead.fname} ${lead.lname}`,
        serviceRequired: lead.service_interest,
        estimatedValue: opportunityData.estimatedValue || lead.payTotal || 0,
        currency: 'AED',
        status: 'qualified',
        priority: opportunityData.priority || 'medium',
        assignedTo: lead.assignTo || opportunityData.createdBy || 1,
        createdBy: opportunityData.createdBy || lead.assignTo || 1,
        source: 'lead_conversion',
        campaign: lead.market_source || '',
        conversionDate: new Date(),
        expectedCloseDate: opportunityData.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        probability: opportunityData.probability || 75,
        stage: 'qualified',
        tags: '',
        notes: '',
        nextAction: 'Follow up with client',
        agreementGenerated: false,
        agreementSent: false,
        agreementSigned: false,
        paymentReceived: false,
        documentsVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update lead status
      await lead.update({
        status: 'opportunity_created',
        convet: 'Opportunity',
        stepComplete: autoGenerateReceipt ? 3 : 2,
        status_date: new Date()
      });

      // Create opportunity activity
      await models.CrmcOpportunityActivities.create({
        opportunityId: opportunity.id,
        activityType: 'opportunity_created',
        activityTitle: 'Opportunity Created',
        description: `Opportunity created from lead ${lead.fname} ${lead.lname}`,
        activityDate: new Date(),
        duration: 0,
        outcome: '',
        nextStep: '',
        assignedTo: opportunityData.createdBy || lead.assignTo || 1,
        priority: 'medium',
        status: 'completed',
        location: '',
        attendees: '',
        createdBy: opportunityData.createdBy || lead.assignTo || 1,
        notes: 'Opportunity automatically generated during lead creation.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Step 3: Auto-generate receipt if requested
    if (autoGenerateReceipt && opportunity) {
      receipt = await models.CrmcOpportunityPayments.create({
        opportunityId: opportunity.id,
        paymentNumber: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        paymentStructure: receiptData.paymentStructure || 'full',
        totalAmount: receiptData.totalAmount || lead.paidYet || 0,
        currency: 'AED',
        status: receiptData.status || 'pending',
        paymentMethod: receiptData.paymentMethod || 'cash',
        paymentDate: receiptData.paymentDate || new Date(),
        dueDate: receiptData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        transactionId: receiptData.transactionId || `TXN-${Date.now()}`,
        paidAmount: receiptData.paidAmount || 0,
        remainingBalance: (receiptData.totalAmount || lead.paidYet || 0) - (receiptData.paidAmount || 0),
        createdBy: receiptData.createdBy || lead.assignTo || 1,
        notes: receiptData.notes || '',
        gateway: receiptData.gateway || 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update lead payment information
      const newPaidYet = (lead.paidYet || 0) + (receiptData.paidAmount || receiptData.totalAmount || 0);
      const newPayBalance = (lead.payTotal || 0) - newPaidYet;

      await lead.update({
        paidYet: newPaidYet,
        payBalance: newPayBalance,
        status: newPayBalance <= 0 ? 'fully_paid' : 'partially_paid',
        stepComplete: autoGenerateAgreement ? 4 : 3,
        status_date: new Date()
      });

      // Create payment activity
      await models.CrmcOpportunityActivities.create({
        opportunityId: opportunity.id,
        activityType: 'payment_received',
        activityTitle: 'Payment Received',
        description: `Payment of AED ${receiptData.totalAmount || lead.paidYet} received`,
        activityDate: new Date(),
        duration: 0,
        outcome: '',
        nextStep: '',
        assignedTo: receiptData.createdBy || lead.assignTo || 1,
        priority: 'medium',
        status: 'completed',
        location: '',
        attendees: '',
        createdBy: receiptData.createdBy || lead.assignTo || 1,
        notes: `Receipt ${receipt.paymentNumber} generated automatically.`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Step 4: Auto-generate agreement if requested
    if (autoGenerateAgreement && opportunity) {
      agreement = await models.CrmcOpportunityAgreements.create({
        opportunityId: opportunity.id,
        agreementNumber: `AGR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        agreementType: agreementData.agreementType || 'service_agreement',
        agreementTitle: agreementData.title || `Service Agreement - ${lead.fname} ${lead.lname}`,
        duration: agreementData.duration || '12 months',
        startDate: agreementData.startDate || new Date(),
        endDate: agreementData.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        amount: agreementData.totalAmount || lead.payTotal || 0,
        currency: 'AED',
        terms: agreementData.termsAndConditions || '',
        specialConditions: agreementData.description || `Service agreement for ${lead.service_interest}`,
        status: 'draft',
        generatedDate: new Date(),
        uploadedToCrm: false,
        uploadedBy: agreementData.createdBy || lead.assignTo || 1,
        createdBy: agreementData.createdBy || lead.assignTo || 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update lead status to reflect agreement generation
      await lead.update({
        status: 'agreement_generated',
        convet: 'Agreement',
        stepComplete: 4,
        status_date: new Date()
      });

      // Create agreement activity
      await models.CrmcOpportunityActivities.create({
        opportunityId: opportunity.id,
        activityType: 'agreement_generated',
        activityTitle: 'Agreement Generated',
        description: `Agreement ${agreement.agreementNumber} generated`,
        activityDate: new Date(),
        duration: 0,
        outcome: '',
        nextStep: '',
        assignedTo: agreementData.createdBy || lead.assignTo || 1,
        priority: 'medium',
        status: 'completed',
        location: '',
        attendees: '',
        createdBy: agreementData.createdBy || lead.assignTo || 1,
        notes: 'Agreement automatically generated during lead creation.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully' + 
                (autoGenerateOpportunity ? ' with opportunity' : '') +
                (autoGenerateReceipt ? ' and receipt' : '') +
                (autoGenerateAgreement ? ' and agreement' : ''),
      data: {
        lead: leadWithRelations,
        opportunity,
        receipt,
        agreement,
        flowComplete: !!(autoGenerateOpportunity && autoGenerateReceipt && autoGenerateAgreement)
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in enhanced lead creation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create lead with automated flow', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Enhanced GET endpoint with flow status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const branch = searchParams.get('branch');
    const region = searchParams.get('region');
    const assignTo = searchParams.get('assignTo');
    const countryInterest = searchParams.get('countryInterest');
    const serviceInterest = searchParams.get('serviceInterest');
    const marketSource = searchParams.get('marketSource');
    const leadQuality = searchParams.get('leadQuality');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const includeFlow = searchParams.get('includeFlow') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { fname: { [Op.like]: `%${search}%` } },
        { lname: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { id_number: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (branch) {
      where.branch = parseInt(branch);
    }

    if (region) {
      where.region = parseInt(region);
    }

    if (assignTo) {
      where.assignTo = parseInt(assignTo);
    }

    if (countryInterest) {
      where.country_interest = countryInterest;
    }

    if (serviceInterest) {
      where.service_interest = serviceInterest;
    }

    if (marketSource) {
      where.market_source = marketSource;
    }

    if (leadQuality) {
      where.lead_quality = leadQuality;
    }

    if (dateFrom || dateTo) {
      where.regdate = {};
      if (dateFrom) {
        where.regdate[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        where.regdate[Op.lte] = new Date(dateTo);
      }
    }

    let leads;
    let total;

    if (includeFlow) {
      // Get leads with their complete flow information
      [leads, total] = await Promise.all([
        models.CrmcForumLeads.findAll({
          where,
          offset: skip,
          limit: limit,
          order: [['created', 'DESC']],
          include: [
            { association: 'dmEmployeeByASSIGNTo', attributes: ['id', 'name'] },
            { association: 'dmEmployeeByCoUNSILOR', attributes: ['id', 'name'] },
            { association: 'dmBranch', attributes: ['id', 'name'] },
            {
              model: models.CrmcOpportunities,
              as: 'dmcOpportunities',
              required: false,
              include: [
                {
                  model: models.CrmcOpportunityPayments,
                  as: 'dmcOpportunityPayments',
                  required: false
                },
                {
                  model: models.CrmcOpportunityAgreements,
                  as: 'dmcOpportunityAgreements',
                  required: false
                }
              ]
            }
          ]
        }),
        models.CrmcForumLeads.count({ where })
      ]);
    } else {
      // Standard lead query
      [leads, total] = await Promise.all([
        models.CrmcForumLeads.findAll({
          where,
          offset: skip,
          limit: limit,
          order: [['created', 'DESC']],
          include: [
            { association: 'dmEmployeeByASSIGNTo', attributes: ['id', 'name'] },
            { association: 'dmEmployeeByCoUNSILOR', attributes: ['id', 'name'] },
            { association: 'dmBranch', attributes: ['id', 'name'] }
          ]
        }),
        models.CrmcForumLeads.count({ where })
      ]);
    }

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      includeFlow
    });
  } catch (error: any) {
    console.error('Error fetching enhanced leads:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch leads', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
