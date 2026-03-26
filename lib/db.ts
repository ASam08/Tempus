import postgres from "postgres";

const POSTGRES_HOST = process.env.POSTGRES_HOST ?? "db";
const POSTGRES_PORT = process.env.POSTGRES_PORT ?? "5432";
const POSTGRES_USER = process.env.POSTGRES_USER ?? "timetable";
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "timetable";
const POSTGRES_DB = process.env.POSTGRES_DB ?? "timetable";

if (!POSTGRES_USER || !POSTGRES_PASSWORD) {
  throw new Error(
    "Missing database configuration. Set POSTGRES_USER/POSTGRES_PASSWORD.",
  );
}

export const DATABASE_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

export const sqlConn = postgres(DATABASE_URL, {
  ssl: false, // Docker local network
});
