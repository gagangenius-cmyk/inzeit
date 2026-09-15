export interface FormFieldDefinition {
  name: string;
  label: string;
}

export interface FormTemplateDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  fields: FormFieldDefinition[];
}

// Generic templates shared across every product - MVP scope: capture structured answers
// online (reviewable by staff like a document) and offer a blank PDF for offline filling.
// No PDF field-merge in this pass.
export const CLIENT_PORTAL_FORMS: FormTemplateDefinition[] = [
  {
    key: 'client-data-sheet',
    title: 'Client Data Sheet',
    description: 'General intake sheet — personal, family, education & work history.',
    icon: '📋',
    fields: [
      { name: 'fullName', label: 'Full Name' },
      { name: 'familyDetails', label: 'Family Details' },
      { name: 'educationHistory', label: 'Education History' },
      { name: 'workHistory', label: 'Work History' },
    ],
  },
  {
    key: 'employment-letter-format',
    title: 'Employment Letter Format',
    description: 'Standard reference-letter format for your current/past employer to fill.',
    icon: '💼',
    fields: [
      { name: 'employerName', label: 'Employer Name' },
      { name: 'position', label: 'Position Held' },
      { name: 'duration', label: 'Employment Duration' },
      { name: 'salaryDetails', label: 'Salary Details' },
    ],
  },
  {
    key: 'name-change-affidavit',
    title: 'Name Change Affidavit',
    description: 'Submit if your legal name has changed since your file was opened.',
    icon: '📝',
    fields: [
      { name: 'oldName', label: 'Previous Name' },
      { name: 'newName', label: 'Current Legal Name' },
      { name: 'reason', label: 'Reason for Change' },
    ],
  },
];

export function getClientPortalForm(key: string): FormTemplateDefinition | null {
  return CLIENT_PORTAL_FORMS.find((form) => form.key === key) || null;
}
