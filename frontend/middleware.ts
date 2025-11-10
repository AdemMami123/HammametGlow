import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/challenges', '/leaderboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // Get auth token from cookies
  const authToken = request.cookies.get('auth-token')?.value;
  
  // Also check for auth state in cookies (Zustand persist storage)
  const authStorage = request.cookies.get('auth-storage')?.value;
  
  let isAuthenticated = false;
  
  if (authStorage) {
    try {
      const authData = JSON.parse(authStorage);
      isAuthenticated = authData?.state?.isAuthenticated === true;
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
    }
  } else if (authToken) {
    isAuthenticated = true;
  }

  // Redirect authenticated users away from login/register pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Add redirect parameter to return after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
