import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./lib/db";

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
