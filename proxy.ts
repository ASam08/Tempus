import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isOnLogin = request.nextUrl.pathname.startsWith("/login");

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isLoggedIn = !!session;

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
