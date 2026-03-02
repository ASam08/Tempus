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
} from "@/lib/data";
import { sqlConn } from "@/lib/db";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { SignupFormSchema, SignupFormState } from "./signupschema";

const sql = sqlConn;

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
    await sql`
      INSERT INTO users (name, email, password, account_enabled)
      VALUES (${name}, ${email}, ${hashedPassword}, ${accountEnabled})
    `;
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
    await sql`
            INSERT INTO timetable_sets (owner_id, title, description)
            VALUES (${owner_id}, ${title}, ${description ?? null})
        `;
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
  errors?: {
    timetable_set_id?: string[];
    day?: string[];
    subject?: string[];
    location?: string[];
    start_time?: string[];
    end_time?: string[];
  };
  message?: string | null;
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
    };
  }
  const set_id = await getTimetableSets(user_id);
  const validatedFields = createTimetableBlock.safeParse({
    timetable_set_id: /*formData.get("timetable_set_id"),*/ set_id[0].id,
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
      consoleLog: console.log(validatedFields.error),
    };
  }
  const { timetable_set_id, day, subject, location, start_time, end_time } =
    validatedFields.data;

  try {
    await sql`
            INSERT INTO timetable_blocks (timetable_set_id, day_of_week, subject, location, start_time, end_time)
            VALUES (${timetable_set_id}, ${day}, ${subject}, ${location}, ${start_time}, ${end_time})
        `;
    console.log(
      `Timetable block for ${subject} on ${day} created successfully`,
    );
  } catch (error) {
    console.error("Error creating timetable block:", error);
    return {
      message: "Error creating timetable block.",
      error,
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
    await sql`
            DELETE FROM timetable_blocks
            WHERE id = ${blockId}
            `;
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

export async function settingsSave(formData: FormData) {
  const user_id = formData.get("userId") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  await updateSettings(user_id, "start_time", start_time);
  await updateSettings(user_id, "end_time", end_time);
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings");
}

export async function updateSettings(
  user_id: string,
  setting_key: string,
  setting_value: string | number | boolean,
) {
  try {
    await sql`
            INSERT INTO user_settings (user_id, setting_key, setting_value)
            VALUES (${user_id}, ${setting_key}, ${setting_value})
            ON CONFLICT (user_id, setting_key)
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        `;
    console.log("Settings updated for user %s", user_id);
  } catch (error) {
    console.error("Error updating settings:", error);
    return {
      message: "Error updating settings",
      error,
    };
  }
}
