import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/xxgcxy", "/classadmin"];
const publicPaths = ["/xxgcxy/login", "/classadmin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return NextResponse.next();
  if (!request.cookies.get("regsysol_session")) {
    const loginPath = pathname.startsWith("/classadmin") ? "/classadmin/login" : "/xxgcxy/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/xxgcxy/:path*", "/classadmin/:path*"]
};
