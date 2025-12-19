import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const decoded = verifyToken(token);
    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: ['/api/protected/:path*'],
};