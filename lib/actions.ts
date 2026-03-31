"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import {
  getTimetableSets,
  getCurrentBlock,
  getNextBlock,
  getUserID,
  getNextBreak,
  blockConflictCheck,
} from "@/lib/data";
import { sqlConn } from "@/lib/db";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { SignupFormSchema, SignupFormState } from "./signupschema";
import { dow } from "@/lib/constants";
import { ConflictBlocks } from "./definitions";
import * as schema from "@/db/schema";
import { sql, eq } from "drizzle-orm";

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.cause?.type === "AccountNotEnabled") {
        console.warn(
          "Account not enabled error encountered during authentication.",
        );
        return "Your account has not been enabled yet.";
      }

      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        case "CallbackRouteError":
          return "An error occurred during authentication.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function signup(
  state: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let accountEnabled: boolean;
  if (process.env.APPROVE_SIGNUPS?.toLowerCase() === "true") {
    accountEnabled = false;
  } else {
    accountEnabled = true;
  }
  const { name, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await sqlConn.insert(schema.users).values({
      name: name,
      email: email,
      password: hashedPassword,
      accountEnabled: accountEnabled,
    });
  } catch {
    return { message: "Failed to create account." };
  }

  return { message: "success" };
}

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

export type BlockState = {
  errors: {
    timetable_set_id?: string[];
    day?: string[];
    subject?: string[];
    location?: string[];
    start_time?: string[];
    end_time?: string[];
  };
  conflicts: ConflictBlocks[];
  message: string;
};

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

const createTimetableBlock = originalTimetableBlockSchema
  .omit({ id: true })
  .refine(
    (data) => {
      const startTimeDate = new Date(`1970-01-01T${data.start_time}:00`);
      const endTimeDate = new Date(`1970-01-01T${data.end_time}:00`);

      return endTimeDate > startTimeDate;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    },
  );

export async function addTimetableBlock(
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
  const set_id = await getTimetableSets(user_id);
  const validatedFields = createTimetableBlock.safeParse({
    timetable_set_id: set_id[0].id,
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

export async function fetchCurrentBlock(dayOfWeek: number, time: string) {
  const user_id = await getUserID();
  if (!user_id) {
    console.error("No user found.");
    return { reason: "no-user" } as const;
  }
  const sets = await getTimetableSets(user_id);

  // Defensive guard
  if (!Array.isArray(sets) || sets.length === 0) {
    console.warn("No timetable sets found for user:", user_id);
    return { reason: "no-set" } as const;
  }

  const timetableSetId = sets[0].id;

  return getCurrentBlock(timetableSetId, dayOfWeek, time);
}

export async function fetchNextBlock(dayOfWeek: number, time: string) {
  const user_id = await getUserID();
  if (!user_id) {
    console.error("No user found.");
    return { reason: "no-user" } as const;
  }
  const sets = await getTimetableSets(user_id);

  // Defensive guard
  if (!Array.isArray(sets) || sets.length === 0) {
    console.warn("No timetable sets found for user:", user_id);
    return { reason: "no-set" } as const;
  }

  const timetableSetId = sets[0].id;

  return getNextBlock(timetableSetId, dayOfWeek, time);
}

export async function fetchNextBreak(dayOfWeek: number, time: string) {
  const user_id = await getUserID();
  if (!user_id) {
    // Explicit sentinel so callers can distinguish "no user" from "no next break"
    console.error("No user found.");
    return { reason: "no-user" } as const;
  }
  const sets = await getTimetableSets(user_id);

  // Defensive guard
  if (!Array.isArray(sets) || sets.length === 0) {
    console.warn("No timetable sets found for user:", user_id);
    return { reason: "no-set" } as const;
  }

  const timetableSetId = sets[0].id;

  return getNextBreak(timetableSetId, dayOfWeek, time);
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

export type SettingsState = {
  errors?: {
    start_time?: string[];
    end_time?: string[];
  };
  message?: string | null;
  timestamp?: number;
};

const settingsSchema = z
  .object({
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
  })
  .refine((data) => toMinutes(data.end_time) > toMinutes(data.start_time), {
    path: ["end_time"],
    message: "End time must be after start time",
  });

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

export async function unhideDow(dayKey: string) {
  const user_id = await getUserID();
  if (!user_id) {
    return { message: "User not authenticated." };
  }

  await updateSettings(user_id, [[dayKey, "true"]]);

  revalidatePath("/dashboard/settings");
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
