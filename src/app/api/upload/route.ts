import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { basename, join } from 'path';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const fileType = file.type;

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${generateUUID()}.${fileExtension}`;

    // Vercel's serverless functions have a read-only filesystem, so files are
    // stored in Vercel Blob rather than written to local disk.
    const blob = await put(`events/${uniqueFileName}`, file, {
      access: 'public',
    });
    const fileUrl = blob.url;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: uniqueFileName,
      size: file.size,
      type: fileType
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter is required' },
        { status: 400 }
      );
    }

    // basename() strips any directory components (e.g. `../../etc/passwd`),
    // so this can only ever resolve to a file directly inside the events dir.
    const filePath = join(process.cwd(), 'public', 'uploads', 'events', basename(filename));
    
    try {
      const fileBuffer = await import('fs').then(fs => fs.promises.readFile(filePath));
      const file = fileBuffer;
      
      return new NextResponse(file, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': file.length.toString(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
