"use server";

import {
  RetreivedTimetableBlocks,
  UserSettings,
  ConflictBlocks,
} from "@/lib/definitions";
import { sqlConn, newsqlConn } from "@/lib/db";
import { auth } from "@/auth";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

const oldsql = sqlConn;
const sql = newsqlConn;

export async function getUserID() {
  console.log("getUserID - AUTH_ON=", process.env.AUTH_ON);

  if (process.env.AUTH_ON === "true") {
    const session = await auth();
    const user_id = session?.user?.id;
    if (!user_id) return null;
    return user_id;
  } else {
    try {
      const result = await sql
        .selectDistinct({ id: schema.timetableSets.ownerId })
        .from(schema.timetableSets);
      console.log("getUserID - SQL result:", result);
      const id = result[0]?.id ?? null;
      console.log("getUserID - resolved id:", id);
      return id;
    } catch (error) {
      console.error("Error retrieving user ID: ", error);
      return null;
    }
  }
}

export async function getTimetableSets(user_id: string) {
  try {
    const result = await sql
      .select({ id: schema.timetableSets.id })
      .from(schema.timetableSets)
      .where(eq(schema.timetableSets.ownerId, user_id))
      .limit(1);
    return result;
  } catch (error) {
    console.error("Error fetching timetable sets:", error);
    return [];
  }
}

export async function getTimetableBlocks(timetable_set_id: string) {
  try {
    // const blocks = await oldsql<RetreivedTimetableBlocks[]>`
    // SELECT id, start_time, end_time, day_of_week, subject, location FROM timetable_blocks
    // WHERE timetable_set_id = ${timetable_set_id}
    // `;
    const blocks: RetreivedTimetableBlocks[] = await sql
      .select({
        id: schema.timetableBlocks.id,
        start_time: schema.timetableBlocks.startTime,
        end_time: schema.timetableBlocks.endTime,
        day_of_week: schema.timetableBlocks.dayOfWeek,
        subject: schema.timetableBlocks.subject,
        location: schema.timetableBlocks.location,
      })
      .from(schema.timetableBlocks)
      .where(eq(schema.timetableBlocks.timetableSetId, timetable_set_id));

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
  const result = await oldsql<RetreivedTimetableBlocks[]>`
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
  const result = await oldsql<RetreivedTimetableBlocks[]>`
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
  const result = await oldsql<RetreivedTimetableBlocks[]>`
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

export async function getUserSettings(user_id: string) {
  try {
    const rows = await oldsql<UserSettings[]>`
      SELECT setting_key, setting_value FROM user_settings
      WHERE user_id = ${user_id}
    `;
    const settings = Object.fromEntries(
      rows.map((row: UserSettings) => [row.setting_key, row.setting_value]),
    );
    return settings ?? null;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
}

export async function blockConflictCheck(
  timetable_set_id: string,
  dayOfWeek: number,
  start_time: string,
  end_time: string,
) {
  try {
    const result = await oldsql<ConflictBlocks[]>`
      SELECT id, subject, start_time, end_time FROM timetable_blocks
      WHERE timetable_set_id = ${timetable_set_id}
        AND day_of_week = ${dayOfWeek}
        AND (
          (start_time < ${end_time}::time AND end_time > ${start_time}::time)
        )
      ORDER BY start_time
    `;
    return result;
  } catch (error) {
    console.error("Error checking block conflicts:", error);
    return null;
  }
}
