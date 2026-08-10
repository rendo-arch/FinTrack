import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fintrack-secret-key-change-in-production-2026'
);

const COOKIE_NAME = 'fintrack-auth';

async function isValidToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Always allow static files and API auth routes
  const isApiAuth = pathname.startsWith('/api/auth');
  if (isApiAuth) return NextResponse.next();

  const isPublicPath = pathname === '/login' || pathname === '/register';

  // Verify token properly (not just check existence)
  const authenticated = token ? await isValidToken(token) : false;

  if (!authenticated && !isPublicPath) {
    // Clear the bad/expired cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (token) {
      response.cookies.delete(COOKIE_NAME);
    }
    return response;
  }

  if (authenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
