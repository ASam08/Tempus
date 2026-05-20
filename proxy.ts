import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isOnLogin = request.nextUrl.pathname.startsWith("/login");
  const isOnSetup = request.nextUrl.pathname.startsWith("/usermigrationsetup");

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isLoggedIn = !!session;

  // If setup is incomplete, only allow /usermigrationsetup
  if (
    isLoggedIn &&
    session.user.userMigrationSetupComplete === false &&
    !isOnSetup
  ) {
    return NextResponse.redirect(new URL("/usermigrationsetup", request.url));
  }

  // Prevent accessing /usermigrationsetup once setup is complete
  if (
    isOnSetup &&
    (!isLoggedIn || session.user.userMigrationSetupComplete !== false)
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

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
