import { NextRequest, NextResponse } from 'next/server';
import { CrmcForumLeads } from '@/models';
import { Op } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const untouchedHours = searchParams.get('untouched_hours') || '6';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const leadQuality = searchParams.get('leadQuality');
    const branch = searchParams.get('branch');
    const region = searchParams.get('region');
    const daysSinceUpdate = searchParams.get('daysSinceUpdate');

    // Calculate the cutoff date (6 hours ago from now)
    const cutoffDate = new Date(Date.now() - (parseInt(untouchedHours) * 60 * 60 * 1000));

    let whereClause: any = {
      last_updated: {
        [Op.lt]: cutoffDate
      }
    };

    // Add additional filters
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (leadQuality) whereClause.lead_quality = leadQuality;
    if (branch) whereClause.branch = parseInt(branch);
    if (region) whereClause.region = parseInt(region);
    // Overrides whatever ?branch= was requested for anyone who isn't CEO -
    // this is the same leads.view permission most sales staff hold.
    if (!isCeo(auth)) {
      if (isBranchManagerOrCeo(auth)) {
        whereClause.branch = Number(auth.branch || 0);
      } else {
        whereClause[Op.or] = [{ assignTo: auth.id }, { Counsilor: auth.id }];
      }
    }

    // Handle days since update filter
    if (daysSinceUpdate) {
      const hours = parseInt(daysSinceUpdate);
      const daysSinceDate = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      if (daysSinceUpdate === '0-6') {
        whereClause.last_updated = {
          [Op.gte]: daysSinceDate,
          [Op.lt]: cutoffDate
        };
      } else if (daysSinceUpdate === '7-30') {
        whereClause.last_updated = {
          [Op.gt]: daysSinceDate,
          [Op.lte]: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))
        };
      } else if (daysSinceUpdate === '30-90') {
        whereClause.last_updated = {
          [Op.gt]: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)),
          [Op.lte]: new Date(Date.now() - (90 * 24 * 60 * 60 * 1000))
        };
      } else if (daysSinceUpdate === '90+') {
        whereClause.last_updated = {
          [Op.lt]: new Date(Date.now() - (90 * 24 * 60 * 60 * 1000))
        };
      }
    }

    const leads = await CrmcForumLeads.findAll({
      where: whereClause,
      attributes: [
        'id', 'fname', 'lname', 'email', 'phone', 'mobile', 'status', 'priority',
        'lead_quality', 'last_updated', 'assignTo', 'case_officer', 'Counsilor',
        'branch', 'region', 'country_interest', 'service_interest', 'regdate', 'created'
      ],
      include: [
        {
          association: 'dmEmployeeByASSIGNTo',
          attributes: ['id', 'name']
        },
        {
          association: 'dmEmployeeByCASEOFFICER',
          attributes: ['id', 'name']
        },
        {
          association: 'dmEmployeeByCoUNSILOR',
          attributes: ['id', 'name']
        },
        {
          association: 'dmBranch',
          attributes: ['id', 'name']
        }
      ],
      order: [['last_updated', 'DESC']],
      limit: 1000
    });

    // Calculate days since last update for each lead
    const leadsWithDaysSince = leads.map(lead => {
      const leadData = lead.toJSON();
      const lastUpdate = new Date(leadData.last_updated);
      const now = new Date();
      const diffMs = now.getTime() - lastUpdate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      return {
        ...leadData,
        days_since_last_update: diffHours
      };
    });

    return NextResponse.json({
      leads: leadsWithDaysSince,
      total: leadsWithDaysSince.length
    });
  } catch (error) {
    console.error('Error fetching untouched leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch untouched leads' },
      { status: 500 }
    );
  }
}
