import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('client-auth-token', '', { httpOnly: true, maxAge: 0 });
  return response;
}
