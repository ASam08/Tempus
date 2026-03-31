import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { DATABASE_URL } from "@/lib/db";

const db = drizzle(DATABASE_URL);

await migrate(db, { migrationsFolder: "./db/migrations" });
