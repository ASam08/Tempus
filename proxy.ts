import { auth } from "@/lib/auth";
import { sqlConn } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isOnLogin = request.nextUrl.pathname.startsWith("/login");
  const isOnSetup = request.nextUrl.pathname.startsWith("/usermigrationsetup");

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  console.log("proxy path:", request.nextUrl.pathname);
  console.log("proxy session:", session?.user?.email ?? "null");
  console.log("proxy cookies:", request.headers.get("cookie"));

  const isLoggedIn = !!session;

  if (isLoggedIn && session.user.email === "admin@tempus.local") {
    const user = await sqlConn
      .select({
        userMigrationSetupComplete: schema.users.userMigrationSetupComplete,
      })
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id as any))
      .limit(1);

    const setupComplete = user[0]?.userMigrationSetupComplete ?? true;

    if (!setupComplete && !isOnSetup) {
      return NextResponse.redirect(new URL("/usermigrationsetup", request.url));
    }

    if (isOnSetup && setupComplete) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (!isLoggedIn && isOnSetup) {
    return NextResponse.redirect(new URL("/login", request.url));
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
