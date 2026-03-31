import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  unique,
  boolean,
  time,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const timetableSets = pgTable("timetable_sets", {
  id: uuid()
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  ownerId: uuid("owner_id").notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  createdAt: timestamp("created_at", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: timestamp("updated_at", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const userTimetableSets = pgTable("user_timetable_sets", {
  id: uuid()
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  userId: uuid("user_id").notNull(),
  timetableSetId: uuid("timetable_set_id").notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: text().notNull(),
    password: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    accountEnabled: boolean("account_enabled").default(true).notNull(),
  },
  (table) => [unique("users_email_key").on(table.email)],
);

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid("user_id").notNull(),
    settingKey: varchar("setting_key", { length: 255 }).notNull(),
    settingValue: text("setting_value").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  },
  (table) => [
    unique("user_settings_user_key_unique").on(table.userId, table.settingKey),
  ],
);

export const timetableBlocks = pgTable("timetable_blocks", {
  id: uuid()
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  timetableSetId: uuid("timetable_set_id").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  subject: varchar({ length: 255 }).notNull(),
  location: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: timestamp("updated_at", { mode: "string" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});
