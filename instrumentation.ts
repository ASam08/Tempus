import { DATABASE_URL } from "./lib/db";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { DATABASE_URL } = await import("@/lib/db");

    const db = drizzle(DATABASE_URL);

    await migrate(db, { migrationsFolder: "./db/migrations" });

    console.log("Migrations complete");
  }
}
