'use client';

export type OperationFieldType = 'text' | 'date' | 'select' | 'textarea' | 'file' | 'number';

export interface OperationField {
  name: string;
  label: string;
  type?: OperationFieldType;
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
  span?: 'full';
  /** Date fields marked true can only be set to today's date - no back-dating, no future-dating. */
  todayOnly?: boolean;
}

export const statusOptions = ['Pending', 'Submitted', 'Under Review', 'Sent for filing', 'Completed', 'Insufficient', 'Registered', 'Rejected', 'Not Applicable'];
export const documentStatusOptions = ['Complete', 'Pending', 'Yet not submitted', 'Not Applicable'];
export const approvedOptions = ['Approved', 'Rejected', 'Pending'];
export const conversationTypes = ['Walk-in', 'Inbound', 'Outbound', 'Email'];

export const commonPersonalFields: OperationField[] = [
  { name: 'clientName', label: 'Client Name', required: true, readOnly: true },
  { name: 'email', label: 'Email', readOnly: true },
  { name: 'phone', label: 'Phone', readOnly: true },
  { name: 'mobile', label: 'Mobile', readOnly: true },
  { name: 'nationality', label: 'Nationality', readOnly: true },
  { name: 'address', label: 'Address', readOnly: true },
  { name: 'dob', label: 'Date of Birth', type: 'date', readOnly: true },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], readOnly: true },
  { name: 'country_interest', label: 'Country Interested', readOnly: true },
  { name: 'service_interest', label: 'Program Interested', readOnly: true },
  { name: 'market_source', label: 'Lead Source', readOnly: true },
  { name: 'counselor', label: 'Counselor', readOnly: true },
  { name: 'case_officer', label: 'Case Processing Officer', readOnly: true },
  { name: 'retnDate', label: 'Date of retention', type: 'date', required: true },
  { name: 'contractExpiry', label: 'Expiry of contract', type: 'date' },
  { name: 'agreeNo', label: 'Agreement No', readOnly: true },
  { name: 'branch', label: 'Branch', readOnly: true },
  { name: 'branchAddress', label: 'Branch Address', readOnly: true },
  { name: 'branchEmail', label: 'Branch Email', readOnly: true },
  { name: 'branchMobile', label: 'Branch Mobile', readOnly: true },
  { name: 'personalFile', label: 'Document File', type: 'file' },
];

export const ecaFields: OperationField[] = [
  { name: 'ecaReceDate', label: 'ECA Package received from client', type: 'date', required: true },
  { name: 'ecaPackage', label: 'Source', type: 'select', options: ['PA', 'Spouse'], required: true },
  { name: 'ecaDocStatus', label: 'Documents status', type: 'select', options: documentStatusOptions, required: true },
  { name: 'ecaAssmBody', label: 'Assessment Body', type: 'select', options: ['WES', 'ICAS', 'IQAS', 'MCC', 'PEBC', 'ICES', 'CES'] },
  { name: 'ecaApplyDate', label: 'Date Applied', type: 'date' },
  { name: 'ecaPayMode', label: 'Payment Mode', type: 'select', options: ['Client Credit Card', 'Company Credit Card'] },
  { name: 'ecaTranSent', label: 'Transcript sent', type: 'select', options: ['Client', 'Company'] },
  { name: 'ecaTranStatus', label: 'Transcript Status', type: 'select', options: ['Accepted', 'Yet not submitted', 'Rejected', 'In process', 'Verification'] },
  { name: 'ecaStatus', label: 'Status', type: 'select', options: statusOptions, required: true },
  { name: 'compDate', label: 'Date of Completion', type: 'date' },
  { name: 'qualification', label: 'Add Qualification', type: 'select', options: ['High School', 'Diploma', 'Bachelors', 'Masters', 'PhD'] },
  { name: 'specialization', label: 'Specialization' },
  { name: 'university', label: 'University' },
  { name: 'rating', label: 'Rating', type: 'select', options: ['+ve', '-ve'] },
  { name: 'ecauid', label: 'App User ID' },
  { name: 'ecausrpsswrd', label: 'App Password' },
  { name: 'regemail', label: 'Registered Email ID' },
  { name: 'regpsswrd', label: 'Registered Password' },
  { name: 'ecaFile', label: 'Document File', type: 'file' },
  { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
];

export const languageFields: OperationField[] = [
  { name: 'langTest', label: 'Language Test', type: 'select', options: ['IELTS(AT)', 'IELTS(GT)', 'PTE', 'TOEFL iBT', 'OET', 'CAE', 'CELPIP'], required: true },
  { name: 'testStatus', label: 'Status', type: 'select', options: statusOptions, required: true },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
  { name: 'reading', label: 'Reading', type: 'number' },
  { name: 'writing', label: 'Writing', type: 'number' },
  { name: 'listening', label: 'Listening', type: 'number' },
  { name: 'speaking', label: 'Speaking', type: 'number' },
  { name: 'testDate', label: 'Test Date', type: 'date' },
  { name: 'testScore', label: 'Test Score' },
  { name: 'languageFile', label: 'Document File', type: 'file' },
  { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
];

export function prefixFields(fields: OperationField[], prefix: string): OperationField[] {
  return fields.map((field) => ({ ...field, name: `${prefix}${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}` }));
}

export function missingRequiredFields(fields: OperationField[], data: Record<string, any>) {
  return fields.filter((field) => field.required && !data[field.name]);
}

export function OperationStageForm({
  fields,
  data,
  color = 'blue',
  onChange,
  locked = false,
}: {
  fields: OperationField[];
  data: Record<string, any>;
  color?: 'blue' | 'purple' | 'indigo' | 'red';
  onChange: (next: Record<string, any>) => void;
  /** When true, every field renders read-only/disabled regardless of its own readOnly flag - used to gate whole stages behind a permission. */
  locked?: boolean;
}) {
  const focusClass = {
    blue: 'focus:ring-blue-500',
    purple: 'focus:ring-purple-500',
    indigo: 'focus:ring-indigo-500',
    red: 'focus:ring-red-500',
  }[color];
  const inputClass = `w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${focusClass} disabled:bg-gray-50 disabled:text-gray-500`;
  const setField = (name: string, value: any) => onChange({ ...data, [name]: value });
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field) => {
        const value = data[field.name] || '';
        const isReadOnly = field.readOnly || locked;
        const label = (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.required && <span className="ml-1 text-red-600">*</span>}
          </label>
        );

        if (field.type === 'textarea') {
          return (
            <div key={field.name} className={field.span === 'full' ? 'md:col-span-2' : ''}>
              {label}
              <textarea value={value} onChange={(event) => setField(field.name, event.target.value)} readOnly={isReadOnly} rows={4} className={inputClass} />
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.name}>
              {label}
              <select value={value} onChange={(event) => setField(field.name, event.target.value)} disabled={isReadOnly} className={inputClass}>
                <option value="">Select</option>
                {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          );
        }

        if (field.type === 'file') {
          const uploaded = value && typeof value === 'object' && 'url' in value ? value : null;
          return (
            <div key={field.name} className={field.span === 'full' ? 'md:col-span-2' : ''}>
              {label}
              {uploaded?.url && <a href={uploaded.url} target="_blank" className="mb-2 block text-xs font-medium text-blue-700 hover:text-blue-900">View uploaded file</a>}
              <input type="file" onChange={(event) => setField(field.name, event.target.files?.[0] || null)} disabled={locked} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">Accepted formats: png, jpeg, jpg, pdf, docx, doc, xls, xlsx.</p>
            </div>
          );
        }

        return (
          <div key={field.name}>
            {label}
            <input
              type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(event) => setField(field.name, event.target.value)}
              readOnly={isReadOnly}
              min={field.type === 'date' && field.todayOnly ? todayIso : undefined}
              max={field.type === 'date' && field.todayOnly ? todayIso : undefined}
              className={inputClass}
            />
          </div>
        );
      })}
    </div>
  );
}
