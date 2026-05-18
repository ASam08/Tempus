import { DATABASE_URL } from "./lib/db";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { DATABASE_URL } = await import("@/lib/db");
    const schema = await import("@/db/schema");
    const { sql } = await import("drizzle-orm");
    const bcrypt = await import("bcryptjs");

    const db = drizzle(DATABASE_URL, { schema });

    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migrations complete");

    const migrationTag = "0006_remove_auth_on";

    const appliedMigrations = await db.execute(
      sql`SELECT hash FROM drizzle.__drizzle_migrations 
      WHERE hash = ${migrationTag} 
      AND created_at > (EXTRACT(EPOCH FROM NOW()) * 1000 - 1800000)::bigint`,
    );

    if (appliedMigrations.length > 0) {
      const existingUsers = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .limit(1);

      if (existingUsers.length === 0) {
        const existingSets = await db
          .selectDistinct({ ownerId: schema.timetableSets.ownerId })
          .from(schema.timetableSets)
          .limit(1);

        if (existingSets.length > 0) {
          const existingOwnerId = existingSets[0].ownerId;
          const tempPassword = generateTempPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          const defaultEmail = "admin@tempus.local";

          try {
            await db.execute(
              sql`INSERT INTO users (id, name, email, email_verified, role, banned, created_at, updated_at)
              VALUES (${existingOwnerId}::uuid, 'Admin', ${defaultEmail}, false, 'admin', false, NOW(), NOW())`,
            );

            await db.insert(schema.account).values({
              id: crypto.randomUUID(),
              accountId: existingOwnerId,
              providerId: "credential",
              userId: existingOwnerId,
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            console.log("═══════════════════════════════════════════════════");
            console.log("  TEMPUS — SINGLE USER MIGRATION");
            console.log("═══════════════════════════════════════════════════");
            console.log("  A user account has been created for your install.");
            console.log(
              "  Please log in and change your password immediately.",
            );
            console.log("");
            console.log("  Email:    " + defaultEmail);
            console.log("  Password: " + tempPassword);
            console.log("");
            console.log(
              "  You can change your email and password in Settings.",
            );
            console.log("═══════════════════════════════════════════════════");
          } catch (error) {
            console.error("Failed to migrate single-user install:", error);
            throw error;
          }
        }
        // else: fresh install with no data — first signup handles everything
      }
      // else: already has users — nothing to do
    }
  }
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}
