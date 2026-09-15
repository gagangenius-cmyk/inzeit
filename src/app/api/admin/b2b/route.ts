import { CrmB2b } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';

const handlers = createCrudHandlers({
  model: CrmB2b,
  entityName: 'B2B partner',
  searchFields: ['name'],
  filters: { status: 'status' },
  // Was missing entirely - any authenticated employee (any role) could
  // create/edit/delete B2B partner records company-wide. 'b2b.manage' is
  // already a real permission key (scripts/seed-roles-permissions.js) held
  // by CEO/Director of Sales, it just was never enforced here.
  requiredPermissions: ['b2b.manage'],
  defaults: (body) => ({
    created: body.created || new Date(),
    created_by: body.created_by || 1,
  }),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
