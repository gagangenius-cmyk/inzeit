/**
 * DMC CRM website lead integration.
 *
 * Use this from a JavaScript website when the CRM endpoint is intentionally
 * public and restricted with WEB_TO_LEADS_ALLOWED_ORIGIN. Do not put a secret
 * WEB_TO_LEADS_API_KEY in browser code; use a server-side proxy instead.
 */
const CRM_WEB_TO_LEADS_URL = 'https://crm.example.com/api/web-to-leads';

export async function submitDmcLead(form) {
  const data = new FormData(form);
  const payload = {
    // Required by the CRM API
    fullName: data.get('fullName'),
    email: data.get('email'),
    phone: data.get('phone'),

    // Optional CRM fields
    Branch: data.get('branch') || 'Dubai',
    ResidentCountry: data.get('residentCountry') || 'UAE',
    DestinationCountry: data.get('destinationCountry') || '',
    ImmigrationType: data.get('immigrationType') || '',
    Education: data.get('education') || '',
    AgeRange: data.get('ageRange') || '',
    LeadSource: data.get('leadSource') || 'Website',
    UTMSource: new URLSearchParams(window.location.search).get('utm_source') || 'Website',
  };

  if (!payload.fullName?.trim() || !payload.email?.trim() || !payload.phone?.trim()) {
    throw new Error('Name, email, and phone are required.');
  }

  const response = await fetch(CRM_WEB_TO_LEADS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Unable to submit your request.');
  }

  return result;
}

// Example:
// document.querySelector('#dmc-lead-form').addEventListener('submit', async (event) => {
//   event.preventDefault();
//   try {
//     await submitDmcLead(event.currentTarget);
//     event.currentTarget.reset();
//     alert('Thank you. Our team will contact you shortly.');
//   } catch (error) {
//     alert(error instanceof Error ? error.message : 'Unable to submit the form.');
//   }
// });
