'use client';

import { upload } from '@vercel/blob/client';

/**
 * Uploads a file directly from the browser to Vercel Blob, bypassing this
 * app's serverless functions entirely for the file bytes (only a small JSON
 * token handshake goes through /api/blob/upload). Use this instead of
 * posting FormData to an API route — Vercel's serverless functions cap
 * request bodies at ~4.5MB, which proof-of-payment scans and signed
 * agreement PDFs can easily exceed.
 */
export async function uploadFileToBlob(
  file: File,
  pathname: string,
  onProgress?: (percentage: number) => void,
) {
  return upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/blob/upload',
    onUploadProgress: onProgress ? (event) => onProgress(event.percentage) : undefined,
  });
}
