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
            sql`INSERT INTO users (id, name, email, email_verified, role, banned, user_migration_setup_complete, created_at, updated_at)
      VALUES (${existingOwnerId}::uuid, 'Admin', ${defaultEmail}, false, 'admin', false, false, NOW(), NOW())`,
          );

          await db.insert(schema.account).values({
            id: crypto.randomUUID(),
            accountId: existingOwnerId as any,
            providerId: "credential",
            userId: existingOwnerId as any,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          console.log("═══════════════════════════════════════════════════");
          console.log("  TEMPUS — SINGLE USER MIGRATION");
          console.log("═══════════════════════════════════════════════════");
          console.log("  Visit your Tempus instance to complete setup.");
          console.log("  Log in with the temporary credentials below,");
          console.log("  then follow the prompts to set your details.");
          console.log("");
          console.log("  Email:    " + defaultEmail);
          console.log("  Password: " + tempPassword);
          console.log("");
          console.log("  You will be asked to set a new email and password");
          console.log("  before you can access the dashboard.");
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

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}
