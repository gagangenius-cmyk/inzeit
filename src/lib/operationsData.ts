import { uploadFileToBlob } from './uploadToBlob';

export type UploadedOperationFile = {
  name: string;
  url: string;
  size: number;
  type: string;
};

/** Replaces browser File values with server-hosted file metadata before a stage is saved. */
export async function uploadOperationFiles(
  value: unknown,
  module: string,
  leadId: number,
): Promise<unknown> {
  if (value instanceof File) {
    // Upload straight from the browser to Vercel Blob (bypasses the ~4.5MB
    // serverless function body limit that a normal multipart POST would hit).
    const safeName = value.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const moduleSafe = module.replace(/[^a-z0-9-]/gi, '');
    const blob = await uploadFileToBlob(value, `operations/${moduleSafe}/${leadId}/${Date.now()}_${safeName}`);
    return {
      name: value.name,
      url: blob.url,
      size: value.size,
      type: value.type,
    } as UploadedOperationFile;
  }

  if (Array.isArray(value)) return Promise.all(value.map((item) => uploadOperationFiles(item, module, leadId)));
  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(async ([key, item]) => [key, await uploadOperationFiles(item, module, leadId)] as const),
    );
    return Object.fromEntries(entries);
  }
  return value;
}

export async function loadOperationStages(module: string, leadId: number, opportunityId: number | null) {
  const query = new URLSearchParams({ leadId: String(leadId) });
  if (opportunityId) query.set('opportunityId', String(opportunityId));
  const response = await fetch(`/api/admin/operations/${module}/save?${query.toString()}`);
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load operations data');
  return result.data as Record<string, Record<string, unknown>>;
}
