import { NextResponse, type NextRequest } from "next/server";
import { STAFF_HIDDEN_WEB_PREFIXES } from "@raqs/shared/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session-codec";

export function middleware(request: NextRequest) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const session = raw ? decodeSession(raw) : null;
  const isLogin = request.nextUrl.pathname === "/login";
  const home = session?.user.role === "ADMIN" ? "/dashboard" : "/products";

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL(home, request.url));
  }
  if (session?.user.role === "STAFF") {
    const path = request.nextUrl.pathname;
    const hidden = STAFF_HIDDEN_WEB_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    if (hidden) return NextResponse.redirect(new URL("/products", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
