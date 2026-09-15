import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { verifyToken } from '@/lib/auth';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Shared token-broker route for every direct-to-Blob client upload in the app
// (proof of payment, signed agreements, opportunity documents, operations
// documents, calendar images). The browser uploads the file bytes straight to
// Vercel Blob — this route only ever sees a small JSON handshake, so it never
// hits the ~4.5MB request-body limit that a normal multipart POST would.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const token = request.cookies.get('auth-token')?.value
          || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        const user = token ? verifyToken(token) : null;
        if (!user) {
          throw new Error('Authentication is required to upload files');
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id, pathname }),
        };
      },
      // No DB writes here — the callback below only fires when Vercel Blob can
      // reach this app over the public internet, which localhost can't during
      // dev. Callers instead make an explicit follow-up request once upload()
      // resolves client-side, so behavior is identical in dev and production.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    );
  }
}
