"use server";

import {
  RetreivedTimetableBlocks,
  UserSettings,
  ConflictBlocks,
} from "@/lib/definitions";
import { sqlConn } from "@/lib/db";
import * as schema from "@/db/schema";
import { sql, and, eq, gt, gte, lt, lte, isNull, not, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getUserID() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user_id = session?.user?.id;
  if (!user_id) return null;
  return user_id;
}

export async function getAllTimetableSets(user_id: string) {
  try {
    const result = await sqlConn
      .select({
        id: schema.timetableSets.id,
        title: schema.timetableSets.title,
      })
      .from(schema.timetableSets)
      .where(eq(schema.timetableSets.ownerId, user_id))
      .orderBy(asc(schema.timetableSets.title));
    return result;
  } catch (error) {
    console.error("Error fetching timetable sets:", error);
    return [];
  }
}

export async function getTimetableBlocks(timetable_set_id: string) {
  try {
    const blocks: RetreivedTimetableBlocks[] = await sqlConn
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
  const result: RetreivedTimetableBlocks[] = await sqlConn
    .select({
      id: schema.timetableBlocks.id,
      start_time: schema.timetableBlocks.startTime,
      end_time: schema.timetableBlocks.endTime,
      day_of_week: schema.timetableBlocks.dayOfWeek,
      subject: schema.timetableBlocks.subject,
      location: schema.timetableBlocks.location,
    })
    .from(schema.timetableBlocks)
    .where(
      and(
        eq(schema.timetableBlocks.timetableSetId, timetable_set_id),
        eq(schema.timetableBlocks.dayOfWeek, dayOfWeek),
        lte(schema.timetableBlocks.startTime, sql`${time}::time`),
        gt(schema.timetableBlocks.endTime, sql`${time}::time`),
      ),
    )
    .limit(1);
  return result[0] ?? null;
}

export async function getNextBlock(
  timetable_set_id: string,
  dayOfWeek: number,
  time: string,
): Promise<RetreivedTimetableBlocks | null> {
  const result: RetreivedTimetableBlocks[] = await sqlConn
    .select({
      id: schema.timetableBlocks.id,
      start_time: schema.timetableBlocks.startTime,
      end_time: schema.timetableBlocks.endTime,
      day_of_week: schema.timetableBlocks.dayOfWeek,
      subject: schema.timetableBlocks.subject,
      location: schema.timetableBlocks.location,
    })
    .from(schema.timetableBlocks)
    .where(
      and(
        eq(schema.timetableBlocks.timetableSetId, timetable_set_id),
        eq(schema.timetableBlocks.dayOfWeek, dayOfWeek),
        gt(schema.timetableBlocks.startTime, sql`${time}::time`),
      ),
    )
    .orderBy(schema.timetableBlocks.startTime)
    .limit(1);
  return result[0] ?? null;
}

export async function getNextBreak(
  timetable_set_id: string,
  dayOfWeek: number,
  time: string,
): Promise<RetreivedTimetableBlocks | null> {
  const t1 = alias(schema.timetableBlocks, "t1");
  const t2 = alias(schema.timetableBlocks, "t2");
  const result: RetreivedTimetableBlocks[] = await sqlConn
    .select({
      id: t1.id,
      start_time: t1.startTime,
      end_time: t1.endTime,
      day_of_week: t1.dayOfWeek,
      subject: t1.subject,
      location: t1.location,
    })
    .from(t1)
    .leftJoin(
      t2,
      and(eq(t1.endTime, t2.startTime), eq(t1.dayOfWeek, t2.dayOfWeek)),
    )
    .where(
      and(
        eq(t1.timetableSetId, timetable_set_id),
        eq(t1.dayOfWeek, dayOfWeek),
        isNull(t2.id),
        lte(t1.startTime, sql`${time}::time`),
        gt(t1.endTime, sql`${time}::time`),
      ),
    )
    .orderBy(t1.startTime)
    .limit(1);
  console.log("Next break result:", result);
  return result[0] ?? null;
}

export async function getUserSettings(user_id: string) {
  try {
    const rows: UserSettings[] = await sqlConn
      .select({
        setting_key: schema.userSettings.settingKey,
        setting_value: schema.userSettings.settingValue,
      })
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, user_id));
    const settings = Object.fromEntries(
      rows.map((row: UserSettings) => [row.setting_key, row.setting_value]),
    );
    return settings;
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
  current_block_id?: string,
) {
  try {
    const result: ConflictBlocks[] = await sqlConn
      .select({
        id: schema.timetableBlocks.id,
        subject: schema.timetableBlocks.subject,
        start_time: schema.timetableBlocks.startTime,
        end_time: schema.timetableBlocks.endTime,
      })
      .from(schema.timetableBlocks)
      .where(
        and(
          eq(schema.timetableBlocks.timetableSetId, timetable_set_id),
          eq(schema.timetableBlocks.dayOfWeek, dayOfWeek),
          lt(schema.timetableBlocks.startTime, sql`${end_time}::time`),
          gt(schema.timetableBlocks.endTime, sql`${start_time}::time`),
          current_block_id
            ? not(eq(schema.timetableBlocks.id, current_block_id))
            : undefined,
        ),
      )
      .orderBy(schema.timetableBlocks.startTime);
    return result;
  } catch (error) {
    console.error("Error checking block conflicts:", error);
    return null;
  }
}

export async function getBlockByID(block_id: string, user_id: string) {
  try {
    const result: RetreivedTimetableBlocks[] = await sqlConn
      .select({
        id: schema.timetableBlocks.id,
        start_time: schema.timetableBlocks.startTime,
        end_time: schema.timetableBlocks.endTime,
        day_of_week: schema.timetableBlocks.dayOfWeek,
        subject: schema.timetableBlocks.subject,
        location: schema.timetableBlocks.location,
      })
      .from(schema.timetableBlocks)
      .innerJoin(
        schema.timetableSets,
        eq(schema.timetableBlocks.timetableSetId, schema.timetableSets.id),
      )
      .where(
        and(
          eq(schema.timetableBlocks.id, block_id),
          eq(schema.timetableSets.ownerId, user_id),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("Error fetching block by ID:", error);
    return null;
  }
}

export async function checkTimetableSetOwnership(
  timetable_set_id: string,
  user_id: string,
): Promise<boolean> {
  try {
    const result = await sqlConn
      .select()
      .from(schema.timetableSets)
      .where(
        and(
          eq(schema.timetableSets.id, timetable_set_id),
          eq(schema.timetableSets.ownerId, user_id),
        ),
      )
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("Error checking timetable set ownership:", error);
    return false;
  }
}
