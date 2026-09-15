import { Op } from 'sequelize';
import { CrmcForumLeads } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

const handlers = createCrudHandlers({
  model: CrmcForumLeads,
  entityName: 'lead',
  searchFields: ['fname', 'lname', 'email', 'phone', 'mobile'],
  filters: { status: 'status' },
  requiredPermissions: ['leads.view'],
  // 'leads.view' is meant to be read-only (this codebase treats view/
  // create/update as distinct permissions everywhere else) - without this,
  // GET/POST/PUT all shared the same list, so a view-only role could create
  // or overwrite leads through this endpoint.
  writePermissions: ['leads.create', 'leads.update'],
  // This is a generic admin CRUD wrapper duplicating /api/leads's own
  // scoping (which has no live frontend caller of its own, but is directly
  // callable) - CEO sees everything, Branch Manager their own branch,
  // everyone else only leads they own, mirroring the (Counsilor OR assignTo)
  // "own leads" check already used throughout src/app/api/leads/route.ts.
  listScope: (auth) => {
    if (isCeo(auth)) return null;
    if (isBranchManagerOrCeo(auth)) return { branch: auth.branch || 0 };
    return { [Op.or]: [{ Counsilor: auth.id }, { assignTo: auth.id }] };
  },
  attributes: [
    'id', 'fname', 'mname', 'lname', 'email', 'phone', 'mobile', 'nationality',
    'address', 'dob', 'gender', 'id_number', 'id_expiry', 'country_interest',
    'service_interest', 'market_source', 'appointment', 'followup', 'folowuptime',
    'followupstat', 'enquiry', 'convet', 'priority', 'regdate', 'regtime',
    'last_updated', 'last_updtd_time', 'stepComplete', 'payType', 'assignTo',
    'case_officer', 'Counsilor', 'branch', 'region', 'payTotal', 'discount',
    'paidYet', 'payBalance', 'feeAgreeDate', 'demandAmt', 'dueDate', 'demdRemark',
    'agreeDate', 'renDate', 'renExpiryDate', 'renew_type', 'status', 'status_date',
    'type', 'created', 'created_by', 'lead_quality', 'lead_date',
    'opportunity_id', 'opportunity_status', 'conversion_date'
  ],
  defaults: (body) => ({
    created: body.created || new Date(),
    created_by: body.created_by || 1,
    status_date: body.status_date || new Date(),
    lead_date: body.lead_date || new Date(),
  }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
