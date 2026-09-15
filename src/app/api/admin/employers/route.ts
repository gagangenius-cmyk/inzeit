import { CrmEmployer } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';
import { sequelize } from '@/lib/sequelize';

const ensureEmployerTable = () =>
  sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_employer (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL,
      mobile VARCHAR(50) NULL,
      paddress TEXT NULL,
      vendor_id INT NOT NULL DEFAULT 0,
      status INT NOT NULL DEFAULT 1,
      website VARCHAR(255) NULL,
      company_name VARCHAR(255) NULL,
      created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by INT NOT NULL DEFAULT 1
    )
  `).then(() => undefined);

const handlers = createCrudHandlers({
  model: CrmEmployer,
  entityName: 'employer',
  searchFields: ['name', 'email', 'company_name', 'mobile'],
  filters: { vendor: 'vendor_id', status: 'status' },
  // Was missing entirely - any authenticated employee (any role) could
  // create/edit/delete employer records company-wide. 'employers.manage' is
  // already a real permission key (scripts/seed-roles-permissions.js) held
  // by CEO/Director of Sales, it just was never enforced here.
  requiredPermissions: ['employers.manage'],
  defaults: (body) => ({
    created: body.created || new Date(),
    created_by: body.created_by || 1,
  }),
  before: ensureEmployerTable,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
