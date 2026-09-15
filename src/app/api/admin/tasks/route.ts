import { CrmTask } from '@/models';
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
  model: CrmTask,
  entityName: 'task',
  searchFields: ['task', 'status', 'doc'],
  filters: {
    status: 'status',
    assignedTo: 'asignTo',
    assignedBy: 'asignBy',
    opportunityId: 'opportunityId',
    visaType: 'visaType',
  },
  attributes: [
    'id',
    'task',
    'dob',
    'date_created',
    'stage',
    'asignTo',
    'asignBy',
    'status',
    'doc',
    'notf',
    'created',
    'opportunityId',
    'visaType',
  ],
  defaults: (body) => ({
    created: body.created || new Date(),
    date_created: body.date_created || new Date().toISOString().slice(0, 10),
  }),
  requiredPermissions: ['operations.view', 'operations.manage'],
  before: ensureDB,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
