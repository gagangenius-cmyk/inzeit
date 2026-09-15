export const WORKFLOW_STATUS_BADGE: Record<string, string> = {
  'IT Manager Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Branch Manager Review': 'bg-orange-50 text-orange-700 border-orange-200',
  'Director Review': 'bg-purple-50 text-purple-700 border-purple-200',
  'Assigned': 'bg-sky-50 text-sky-700 border-sky-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Resolved Awaiting Confirmation': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Closed': 'bg-slate-100 text-slate-700 border-slate-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
};

export const PRIORITY_BADGE: Record<string, string> = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const FILTER_TABS: Array<{ label: string; workflowStatus?: string }> = [
  { label: 'All' },
  { label: 'IT review', workflowStatus: 'IT Manager Review' },
  { label: 'Branch approval', workflowStatus: 'Branch Manager Review' },
  { label: 'Assigned', workflowStatus: 'Assigned' },
  { label: 'In progress', workflowStatus: 'In Progress' },
  { label: 'Resolved', workflowStatus: 'Resolved Awaiting Confirmation' },
  { label: 'Closed', workflowStatus: 'Closed' },
];

export const ITSupportCategoryOptions = [
  'Laptop / Desktop Hardware',
  'Access & Accounts',
  'New Procurement',
  'Network & Internet',
  'Email & Communication',
  'Software & Licensing',
] as const;

export const ITSupportPriorityOptions = ['High', 'Medium', 'Low'] as const;

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
