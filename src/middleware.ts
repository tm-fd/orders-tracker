import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { BASE_PATH } from "@/auth";
import { PUBLIC_ROUTES, LOGIN, ROOT, PROTECTED_SUB_ROUTES } from "@/lib/routes";




export async function middleware(request) {
  const { nextUrl } = request;
  const session = await auth();
  const isAuthenticated = !!session?.user;

  // Check if the user's email is verified
  const isEmailVerified = session?.user?.emailVerified;
  
  const isPublicRoute = (
    (PUBLIC_ROUTES.find(route => nextUrl.pathname.startsWith(route))) && 
    !PROTECTED_SUB_ROUTES.find(route => nextUrl.pathname.includes(route))
  );

  // Redirect to login if not authenticated or email not verified
  if (!isAuthenticated || !isEmailVerified) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL(LOGIN, nextUrl));
    }
  }
   return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)', '/(tr|en)/:path*']
};
