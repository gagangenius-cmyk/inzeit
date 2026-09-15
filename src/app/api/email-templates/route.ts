import { NextRequest, NextResponse } from 'next/server';
import { models, sequelize } from '@/models';
import { QueryTypes } from 'sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const toPlain = (row: any) => row?.get ? row.get({ plain: true }) : row;

function normalizeTemplate(row: any) {
  const template = toPlain(row);
  return {
    id: String(template.id),
    name: template.program || `Template ${template.id}`,
    description: '',
    category: template.ops ? 'notification' : 'custom',
    subject: template.program || `Template ${template.id}`,
    htmlContent: template.template || '',
    textContent: template.template || '',
    variables: [],
    status: Number(template.status) === 1 ? 'active' : 'inactive',
    metadata: {
      createdBy: String(template.created_by || ''),
      createdAt: template.created,
      version: 1,
      usageCount: 0,
    },
    settings: {
      trackOpens: false,
      trackClicks: false,
      unsubscribeLink: false,
      priority: 'normal',
    },
    tags: [template.ops ? 'ops' : '', template.sales ? 'sales' : ''].filter(Boolean),
    raw: template,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'templates';
    const limit = Math.max(Number(searchParams.get('limit') || 10), 1);
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase() || '';

    if (action === 'campaigns') {
      return NextResponse.json({ success: true, campaigns: [], total: 0, limit, offset });
    }

    if (action === 'recipients') {
      return NextResponse.json({ success: true, recipients: [], total: 0, limit, offset });
    }

    const rows = await models.CrmEmailTemplates.findAll({
      order: [['created', 'DESC']],
    });

    let templates = rows.map(normalizeTemplate);
    if (status && status !== 'all') {
      templates = templates.filter((template) => template.status === status);
    }
    if (search) {
      templates = templates.filter((template) =>
        template.name.toLowerCase().includes(search) ||
        template.htmlContent.toLowerCase().includes(search)
      );
    }

    if (action === 'statistics') {
      return NextResponse.json({
        success: true,
        statistics: {
          totalTemplates: templates.length,
          activeTemplates: templates.filter((template) => template.status === 'active').length,
          totalCampaigns: 0,
          sentCampaigns: 0,
          totalRecipients: 0,
          activeRecipients: 0,
          totalEmailsSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          averageOpenRate: 0,
        },
      });
    }

    if (action === 'template') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
      }
      const template = templates.find((item) => item.id === String(id));
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, template });
    }

    if (action === 'campaign') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      templates: templates.slice(offset, offset + limit),
      total: templates.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error in email templates API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['templates.manage']);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const action = body.action;

    if (action === 'create_template') {
      const data = body.data || {};
      await sequelize.query(
        `INSERT INTO crm_email_templates (program, template, created, status, ops, sales, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            data.name || data.subject || 'Email Template',
            data.htmlContent || data.textContent || '',
            new Date(),
            data.status === 'inactive' ? 0 : 1,
            data.tags?.includes?.('ops') ? 1 : 0,
            data.tags?.includes?.('sales') ? 1 : 0,
            Number(data.createdBy || 1),
          ],
        }
      );
      const rows = await sequelize.query(
        `SELECT * FROM crm_email_templates ORDER BY id DESC LIMIT 1`,
        { type: QueryTypes.SELECT }
      );
      return NextResponse.json({ success: true, template: normalizeTemplate(rows[0]) }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Only database-backed template creation is supported on this endpoint.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in email templates API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['templates.manage']);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }
    const data = body.data || {};
    await sequelize.query(
      `UPDATE crm_email_templates SET program = ?, template = ?, status = ? WHERE id = ?`,
      {
        replacements: [
          data.name || data.subject || 'Email Template',
          data.htmlContent || data.textContent || '',
          data.status === 'inactive' ? 0 : 1,
          id,
        ],
      }
    );
    const rows = await sequelize.query(`SELECT * FROM crm_email_templates WHERE id = ?`, {
      replacements: [id],
      type: QueryTypes.SELECT,
    });
    if (!rows[0]) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, template: normalizeTemplate(rows[0]) });
  } catch (error: any) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }
    await models.CrmEmailTemplates.destroy({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
