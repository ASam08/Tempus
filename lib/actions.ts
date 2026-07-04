"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import {
  getCurrentBlock,
  getNextBlock,
  getUserID,
  getNextBreak,
  blockConflictCheck,
  checkTimetableSetOwnership,
} from "@/lib/data";
import { sqlConn } from "@/lib/db";
import { dow } from "@/lib/constants";
import { BlockState, SettingsState } from "@/lib/definitions";
import * as schema from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { timeToMinutes } from "@/lib/utils";

const TimetableSetSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
});

const createTimetableSet = TimetableSetSchema.omit({ id: true });

export async function createNewTimetableSet(
  prevState: any,
  formData: FormData,
) {
  const user_id = await getUserID();
  const validatedFields = createTimetableSet.safeParse({
    owner_id: user_id,
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to create timetable set.",
    };
  }

  const { owner_id, title, description } = validatedFields.data;

  try {
    await sqlConn.insert(schema.timetableSets).values({
      ownerId: owner_id,
      title: title,
      description: description ?? null,
    });
    console.log(`Timetable set ${title} created successfully`);
  } catch (error) {
    console.error("Error creating timetable set:", error);
    return {
      message: "Error creating timetable set.",
      error,
    };
  }

  revalidatePath("/dashboard/timetable");
  redirect("/dashboard/timetable");
}

const originalTimetableBlockSchema = z.object({
  id: z.string(),
  timetable_set_id: z.string(),
  day: z.coerce
    .number({ error: "Choose a day" })
    .int()
    .min(1, "Choose a day")
    .max(7, "Choose a valid day"),
  subject: z.string().min(1, "Subject is required"),
  location: z.string().min(1, "Location is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
});

const refinedTimetableBlock = originalTimetableBlockSchema
  .omit({ id: true })
  .refine(
    (data) => {
      const startTimeDate = new Date(
        `1970-01-01T${data.start_time.slice(0, 5)}:00`,
      );
      const endTimeDate = new Date(
        `1970-01-01T${data.end_time.slice(0, 5)}:00`,
      );
      return endTimeDate > startTimeDate;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    },
  );

export async function addTimetableBlock(
  setId: string,
  prevState: BlockState,
  formData: FormData,
) {
  const user_id = await getUserID();
  if (!user_id) {
    return {
      message: "User not authenticated. Please log in.",
      errors: {},
      conflicts: [],
    };
  }
  const set_id = setId;
  const checkSetOwnership = await checkTimetableSetOwnership(set_id, user_id);
  if (!checkSetOwnership) {
    return {
      message: "User does not own the timetable set.",
      errors: {},
      conflicts: [],
    };
  }
  const validatedFields = refinedTimetableBlock.safeParse({
    timetable_set_id: set_id,
    day: formData.get("day_of_week"),
    subject: formData.get("subject"),
    location: formData.get("location"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to add timetable block.",
      conflicts: [],
    };
  }
  const { timetable_set_id, day, subject, location, start_time, end_time } =
    validatedFields.data;

  const conflicts = await blockConflictCheck(
    timetable_set_id,
    day,
    start_time,
    end_time,
  );
  if (conflicts === null) {
    return {
      message: "Error checking conflicts",
      conflicts: [],
      errors: {},
    };
  }
  if (conflicts.length > 0) {
    return {
      message: "Time conflict with existing block(s)",
      conflicts: conflicts,
      errors: {},
    };
  }
  try {
    await sqlConn.insert(schema.timetableBlocks).values({
      timetableSetId: timetable_set_id,
      dayOfWeek: day,
      subject: subject,
      location: location,
      startTime: start_time,
      endTime: end_time,
    });
    console.log(
      `Timetable block for ${subject} on ${day} created successfully`,
    );
  } catch (error) {
    console.error("Error creating timetable block:", error);
    return {
      message: "Error creating timetable block.",
      errors: {},
      conflicts: [],
    };
  }
  revalidatePath("/dashboard/timetable");
  redirect("/dashboard/timetable");
}

export async function updateTimetableBlock(
  blockId: string,
  prevState: BlockState,
  formData: FormData,
) {
  const user_id = await getUserID();
  if (!user_id) {
    return {
      message: "User not authenticated. Please log in.",
      errors: {},
      conflicts: [],
    };
  }

  let set_result;
  try {
    set_result = await sqlConn
      .select({ timetableSetId: schema.timetableSets.id })
      .from(schema.timetableBlocks)
      .innerJoin(
        schema.timetableSets,
        eq(schema.timetableBlocks.timetableSetId, schema.timetableSets.id),
      )
      .where(
        and(
          eq(schema.timetableBlocks.id, blockId),
          eq(schema.timetableSets.ownerId, user_id),
        ),
      )
      .limit(1);
  } catch (error) {
    console.error("Error fetching timetable set for block update:", error);
    return {
      message: "Error fetching timetable set for block update.",
      errors: {},
      conflicts: [],
    };
  }
  const set_id = set_result[0]?.timetableSetId;
  if (!set_id) {
    console.error(
      "No timetable set found for block update with block ID:",
      blockId,
    );
    return {
      message: "No timetable set found for block update.",
      errors: {},
      conflicts: [],
    };
  }
  const validatedFields = refinedTimetableBlock.safeParse({
    timetable_set_id: set_id,
    day: formData.get("day_of_week"),
    subject: formData.get("subject"),
    location: formData.get("location"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to update timetable block.",
      conflicts: [],
    };
  }
  const { timetable_set_id, day, subject, location, start_time, end_time } =
    validatedFields.data;

  const conflicts = await blockConflictCheck(
    timetable_set_id,
    day,
    start_time,
    end_time,
    blockId,
  );
  if (conflicts === null) {
    return {
      message: "Error checking conflicts",
      conflicts: [],
      errors: {},
    };
  }
  if (conflicts.length > 0) {
    return {
      message: "Time conflict with existing block(s)",
      conflicts: conflicts,
      errors: {},
    };
  }
  try {
    await sqlConn
      .update(schema.timetableBlocks)
      .set({
        dayOfWeek: day,
        subject: subject,
        location: location,
        startTime: start_time,
        endTime: end_time,
      })
      .where(
        and(
          eq(schema.timetableBlocks.id, blockId),
          eq(schema.timetableBlocks.timetableSetId, set_id),
        ),
      );
    console.log(
      `Timetable block for ${subject} on ${day} updated successfully`,
    );
  } catch (error) {
    console.error("Error updating timetable block:", error);
    return {
      message: "Error updating timetable block.",
      errors: {},
      conflicts: [],
    };
  }
  revalidatePath("/dashboard/timetable");
  redirect("/dashboard/timetable");
}

type BlockRequestType = "current" | "next" | "next-break";

export async function fetchDashboardCard(
  type: BlockRequestType,
  setId: string,
  dayOfWeek: number,
  time: string,
) {
  const user_id = await getUserID();
  if (!user_id) return { reason: "no-user" } as const;

  const owns = await checkTimetableSetOwnership(setId, user_id);
  if (!owns) return { reason: "no-ownership" } as const;

  switch (type) {
    case "current":
      return getCurrentBlock(setId, dayOfWeek, time);
    case "next":
      return getNextBlock(setId, dayOfWeek, time);
    case "next-break":
      return getNextBreak(setId, dayOfWeek, time);
    default:
      return { reason: "invalid-type" } as const;
  }
}

export async function deleteBlock(id: string) {
  const blockId = id;

  try {
    await sqlConn
      .delete(schema.timetableBlocks)
      .where(eq(schema.timetableBlocks.id, blockId));
    console.log("Block %a deleted", blockId);
    revalidatePath("/dashboard/timetable");
  } catch (error) {
    console.error("Block ID not found: ", blockId);
    console.error("Error - ", error);
    return {
      message: "Error deleting block",
      error,
    };
  }
}

const settingsSchema = z
  .object({
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => timeToMinutes(data.end_time)! > timeToMinutes(data.start_time)!,
    {
      path: ["end_time"],
      message: "End time must be after start time",
    },
  );

export async function settingsSave(
  prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user_id = await getUserID();
  if (!user_id) {
    return { message: "User not authenticated." };
  }

  const rawSettings = {
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  };
  const validatedSettings = settingsSchema.safeParse(rawSettings);
  if (!validatedSettings.success) {
    return { errors: validatedSettings.error.flatten().fieldErrors };
  }

  const { start_time, end_time } = validatedSettings.data;
  const timeSettings: [string, FormDataEntryValue][] = [
    ["start_time", start_time],
    ["end_time", end_time],
  ];

  const dayValues = Object.fromEntries(
    dow.map((day): [string, FormDataEntryValue] => [
      day,
      formData.get(day) ? "true" : "false",
    ]),
  );

  const data = [...timeSettings, ...Object.entries(dayValues)];
  const result = await updateSettings(user_id, data);

  revalidatePath("/dashboard/settings");
  return { message: result?.message, timestamp: Date.now() };
}

const DAY_KEYS = new Set(dow);

export async function unhideDow(dayKey: string) {
  const user_id = await getUserID();
  if (!user_id) return { message: "User not authenticated." };

  if (!DAY_KEYS.has(dayKey)) {
    return { message: "Invalid day." };
  }

  await updateSettings(user_id, [[dayKey, "true"]]);
  revalidatePath("/dashboard/settings");
}

export async function setLastTimetableSet(setId: string) {
  const user_id = await getUserID();
  if (!user_id) {
    return { message: "User not authenticated." };
  }
  await updateSettings(user_id, [["last_timetable_set_id", setId]]);
  return { message: "Last timetable set updated." };
}

export async function updateSettings(
  user_id: string,
  data: [string, FormDataEntryValue][],
) {
  const ALLOWED_SETTINGS = new Set([
    "start_time",
    "end_time",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "last_timetable_set_id",
  ]);

  const rows = data
    .filter(([key, value]) => ALLOWED_SETTINGS.has(key) && value !== null)
    .map(([key, value]) => ({
      userId: user_id,
      settingKey: key,
      settingValue: String(value),
    }));

  if (rows.length === 0) return;
  try {
    await sqlConn
      .insert(schema.userSettings)
      .values(rows)
      .onConflictDoUpdate({
        target: [schema.userSettings.userId, schema.userSettings.settingKey],
        set: {
          settingValue: sql`EXCLUDED.setting_value`,
          updatedAt: sql`NOW()`,
        },
      });
    console.log("Settings updated for user %s", user_id);
    return { message: "success", errors: {} };
  } catch (error) {
    console.error("Error updating settings:", error);
    return {
      message: "Error updating settings",
      error,
    };
  }
}

export async function markSetupComplete(
  userId: string,
): Promise<{ error?: string }> {
  try {
    await sqlConn
      .update(schema.users)
      .set({ userMigrationSetupComplete: true })
      .where(eq(schema.users.id, userId as any));
    return {};
  } catch (error) {
    console.error("Failed to mark setup complete:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
