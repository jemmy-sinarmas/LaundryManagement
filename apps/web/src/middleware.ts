import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PREFIXES = ['/login', '/track', '/_next', '/favicon.ico'];

// Routes only admins may visit
const ADMIN_ONLY_PREFIXES = [
  '/dashboard', '/users', '/customers', '/items',
  '/expenses', '/inventory', '/reports',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret');
    const { payload } = await jwtVerify(token, secret);
    const role = (payload as { role?: string }).role;

    // Kasir accessing admin-only routes → redirect to POS
    if (role === 'kasir' && ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/pos', req.url));
    }

    // Admin accessing /pos → redirect to dashboard
    if (role === 'admin' && pathname.startsWith('/pos')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico).*)'],
};
