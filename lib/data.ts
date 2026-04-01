"use server";

import {
  RetreivedTimetableBlocks,
  UserSettings,
  ConflictBlocks,
} from "@/lib/definitions";
import { sqlConn } from "@/lib/db";
import { auth } from "@/auth";
import * as schema from "@/db/schema";
import { sql, and, eq, gt, gte, lt, lte, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import crypto from "crypto";

export async function getUserID() {
  console.log("getUserID - AUTH_ON=", process.env.AUTH_ON);

  if (process.env.AUTH_ON === "true") {
    const session = await auth();
    const user_id = session?.user?.id;
    if (!user_id) return null;
    return user_id;
  } else {
    try {
      const result = await sqlConn
        .selectDistinct({ id: schema.timetableSets.ownerId })
        .from(schema.timetableSets);
      console.log("getUserID - SQL result:", result);
      const id = result[0]?.id ?? crypto.randomUUID();
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
    const result = await sqlConn
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
        ),
      )
      .orderBy(schema.timetableBlocks.startTime);
    return result;
  } catch (error) {
    console.error("Error checking block conflicts:", error);
    return null;
  }
}
