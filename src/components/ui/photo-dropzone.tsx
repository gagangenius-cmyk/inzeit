'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { uploadFileToBlob } from '@/lib/uploadToBlob';

interface PhotoDropzoneProps {
  value?: string | null;
  onChange: (url: string) => void;
  pathPrefix: string;
  label?: string;
}

// Drag-and-drop (or click-to-browse) photo upload, used wherever a record
// needs a headshot/avatar. Uploads straight to Blob storage via the same
// client-upload helper the rest of the app uses, so there's no new API route.
export function PhotoDropzone({ value, onChange, pathPrefix, label = 'Photo' }: PhotoDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadFileToBlob(file, `${pathPrefix}/${Date.now()}_${safeName}`);
      onChange(blob.url);
    } catch {
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }, [onChange, pathPrefix]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  });

  return (
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div
        {...getRootProps()}
        className={`mt-1 flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed p-3 transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <UploadCloud className="h-6 w-6 text-slate-400" />
          )}
        </div>
        <div className="text-sm text-slate-500">
          {uploading ? 'Uploading…' : isDragActive ? 'Drop the photo here' : 'Drag & drop a photo, or click to browse'}
        </div>
        {value && !uploading && (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onChange(''); }}
            className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
