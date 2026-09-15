import { CrmAccounts } from '@/models';
import { createCrudHandlers } from '@/lib/apiCrud';
import { connectDB } from '@/lib/sequelize';

let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

const handlers = createCrudHandlers({
  model: CrmAccounts,
  entityName: 'account',
  searchFields: ['account_no', 'bank_name', 'bank_beneficiary', 'iban'],
  filters: { bank: 'bank_name' },
  requiredPermissions: ['finance.view', 'finance.manage'],
  before: ensureDB,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
