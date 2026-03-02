"use server";

import { RetreivedTimetableBlocks } from "@/lib/definitions";
import { sqlConn } from "@/lib/db";
import { auth } from "@/auth";

const sql = sqlConn;

export async function testConnection() {
  try {
    const data = await sql`SELECT version()`;
    console.log("Database connection successful:", data);
    return data;
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

export async function getUserID() {
  if (process.env.AUTH_ON === "true") {
    const session = await auth();
    const user_id = session?.user?.id;
    if (!user_id) return null;
    return user_id;
  }
  try {
    const result = await sql<{ id: string }[]>`
      SELECT DISTINCT owner_id AS id FROM timetable_sets
      LIMIT 1
    `;
    return result[0]?.id ?? null;
  } catch (error) {
    console.error("Error retrieving user ID: ", error);
    return null;
  }
}

export async function getTimetableSets(user_id: string) {
  try {
    const result = await sql<{ id: string }[]>`
      SELECT id FROM timetable_sets
      WHERE owner_id = ${user_id}
      LIMIT 1
    `;

    return result;
  } catch (error) {
    console.error("Error fetching timetable sets:", error);
    return [];
  }
}

export async function getTimetableBlocks(timetable_set_id: string) {
  try {
    const blocks = await sql<RetreivedTimetableBlocks[]>`
    SELECT id, start_time, end_time, day_of_week, subject, location FROM timetable_blocks
    WHERE timetable_set_id = ${timetable_set_id}
    `;
    return blocks;
  } catch (error) {
    console.error("Error fetching timetable blocks:", error);
    return [];
  }
}

export async function getCurrentBlock(
  timetable_set_id: string,
  dayOfWeek: number,
  time: string,
): Promise<RetreivedTimetableBlocks | null> {
  const result = await sql<RetreivedTimetableBlocks[]>`
    SELECT id, start_time, end_time, day_of_week, subject, location
    FROM timetable_blocks
    WHERE timetable_set_id = ${timetable_set_id}
      AND day_of_week = ${dayOfWeek}
      AND start_time <= ${time}::time
      AND end_time > ${time}::time
    LIMIT 1
  `;

  return result[0] ?? null;
}

export async function getNextBlock(
  timetable_set_id: string,
  dayOfWeek: number,
  time: string,
): Promise<RetreivedTimetableBlocks | null> {
  const result = await sql<RetreivedTimetableBlocks[]>`
    SELECT id, start_time, end_time, day_of_week, subject, location
    FROM timetable_blocks
    WHERE timetable_set_id = ${timetable_set_id}
      AND day_of_week = ${dayOfWeek}
      AND start_time > ${time}::time
    ORDER BY start_time
    LIMIT 1
  `;

  return result[0] ?? null;
}

export async function getNextBreak(
  timetable_set_id: string,
  dayOfWeek: number,
  time: string,
): Promise<RetreivedTimetableBlocks | null> {
  const result = await sql<RetreivedTimetableBlocks[]>`
    SELECT 
      t1.subject AS subject,
      t1.start_time AS start_time,
      t1.end_time AS end_time,
      t2.subject AS next_subject,
      t2.start_time AS next_start_time,
      t2.end_time AS next_end_time 
    FROM timetable_blocks AS t1 
    LEFT JOIN timetable_blocks AS t2 
    ON t1.end_time = t2.start_time 
      AND t1.day_of_week = t2.day_of_week
    WHERE t1.timetable_set_id = ${timetable_set_id}
      AND t1.day_of_week = ${dayOfWeek} 
      AND t2.id IS NULL 
      AND t1.start_time <= ${time}::time
      AND t1.end_time > ${time}::time
    ORDER BY t1.start_time
    LIMIT 1
    `;

  return result[0] ?? null;
}

export async function getUserSettings(user_id: string, setting_key: string) {
  try {
    const settings = await sql<
      { setting_key: string; setting_value: string }[]
    >`
      SELECT setting_key, setting_value FROM user_settings
      WHERE user_id = ${user_id}
        AND setting_key = ${setting_key}
    `;
    return settings[0] ?? null;
  } catch (error) {
    console.error(
      "Error fetching user settings:",
      error,
      "user_id:",
      user_id,
      "setting_key:",
      setting_key,
    );
    return null;
  }
}
