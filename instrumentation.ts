export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { DATABASE_URL } = await import("@/lib/db");
    const schema = await import("@/db/schema");

    const requiredEnvVars = ["BETTER_AUTH_SECRET"];

    const warnEnvVars: [string, string][] = [
      ["TEMPUS_URL", "http://localhost:3000"],
      ["RESEND_API_KEY", "not set (email sending disabled)"],
      ["EMAIL_DOMAIN", "not set (email sending disabled)"],
    ];

    const missing = requiredEnvVars.filter((key) => !process.env[key]);
    const warned = warnEnvVars.filter(([key]) => !process.env[key]);

    if (missing.length > 0) {
      console.error("═══════════════════════════════════════════════════");
      console.error("  TEMPUS — MISSING REQUIRED ENVIRONMENT VARIABLES");
      console.error("═══════════════════════════════════════════════════");
      missing.forEach((key) => console.error(`  Missing: ${key}`));
      console.error("");
      console.error("  Please check your compose.yaml and restart.");
      console.error("═══════════════════════════════════════════════════");
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }

    if (warned.length > 0) {
      console.warn("═══════════════════════════════════════════════════");
      console.warn("  TEMPUS — WARNING");
      console.warn("═══════════════════════════════════════════════════");
      warned.forEach(
        ([key, defaultValue]) => (
          console.warn(`  ${key} is not set,`),
          console.warn(`  defaulting to ${defaultValue}`)
        ),
      );
      console.warn("");
      console.warn("  Tempus may not behave correctly if this variable");
      console.warn("  is not set.");
      console.warn("═══════════════════════════════════════════════════");
    }

    const db = drizzle(DATABASE_URL, { schema });

    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migrations complete");
  }
}
