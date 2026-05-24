import { NextRequest, NextResponse } from "next/server";
import { authCookieName, canAccessRoute, verifySessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(authCookieName)?.value;

  if (pathname === "/login") {
    if (token && (await verifySessionToken(token))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (!token || !(await verifySessionToken(token))) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifySessionToken(token);
  if (user && !canAccessRoute(user.role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard?error=access-denied", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
