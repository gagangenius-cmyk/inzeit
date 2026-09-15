import { NextRequest, NextResponse } from 'next/server'
import { Crm3partyPayment, Crm3partyPaymentDet, CrmcForumLeads } from '@/models'
import { requireAuth, isAuthError } from '@/lib/apiAuth'
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks'
import { CACHE_TAGS, invalidateReportCaches } from '@/lib/reportCache'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['payments.view', 'finance.view'])
  if (isAuthError(auth)) return auth
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const leadId = searchParams.get('leadId')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (leadId) {
      where.leadId = parseInt(leadId)
    }

    if (status) {
      where.status = status
    }

    if (paymentMethod) {
      where.payMethod = paymentMethod
    }

    const [payments, total] = await Promise.all([
      Crm3partyPayment.findAll({
        where,
        attributes: [
          'id', 'leadId', 'date', 'currency_id', 'amount', 'Tax', 'payMethod',
          'emp_id', 'receipt_date', 'cc_number', 'receipt', 'counselor_receipt',
          'trans_or_ref_number', 'remarks'
        ],
        offset: skip,
        limit: limit,
        order: [['date', 'DESC']],
      }),
      Crm3partyPayment.count({ where })
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['payments.view', 'payments.create', 'finance.view', 'finance.manage'])
  if (isAuthError(auth)) return auth
  try {
    const data = await request.json()
    const { details, ...paymentData } = data

    // Branch Manager may only record a payment for a lead in their own
    // branch; CEO is unrestricted.
    if (isBranchManagerOrCeo(auth) && !isCeo(auth) && paymentData.leadId) {
      const lead = await CrmcForumLeads.findByPk(Number(paymentData.leadId), { attributes: ['branch'] })
      if (lead && lead.get('branch') !== null && Number(lead.get('branch')) !== Number(auth.branch || 0)) {
        return NextResponse.json({ error: 'You can only record a payment for a lead in your own branch' }, { status: 403 })
      }
    }

    // Create payment record
    const payment = await Crm3partyPayment.create({
      ...paymentData,
      receipt_date: new Date(),
      payoption: paymentData.payoption || '',
      paycardoption: paymentData.paycardoption || ''
    });

    // Create payment details if provided
    if (details && details.length > 0) {
      const paymentDetails = details.map((detail: any) => ({
        ...detail,
        payId: payment.id
      }))

      await Crm3partyPaymentDet.bulkCreate(paymentDetails)
    }

    // Reload with associations
    const paymentWithDetails = await Crm3partyPayment.findByPk(payment.id, {
      include: [
        {
          association: 'dmcForumLeads',
          attributes: ['id', 'fname', 'lname', 'email']
        },
        {
          model: Crm3partyPaymentDet,
          as: 'dm3partyPaymentDets'
        }
      ]
    });

    invalidateReportCaches([CACHE_TAGS.payments])

    return NextResponse.json(paymentWithDetails, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
