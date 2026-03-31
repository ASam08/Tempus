export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string | null;
  updatedAt: string | null;
  accountEnabled: boolean;
};

export type TimetableSet = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type TimetableBlock = {
  id: string;
  timetable_set_id: string;
  subject: string;
  location: string;
  start_time: string;
  end_time: string;
  day_of_week:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  created_at: string;
  updated_at: string;
};

export type TimetableEntry = {
  id: string;
  timetable_set_id: string;
  timetable_block_id: string;
  subject: string;
  location: string;
  created_at: string;
  updated_at: string;
};

export type UserTimetableSets = {
  id: string;
  user_id: string;
  timetable_set_id: string;
};

export type Version = {
  version: string;
};

export type RetreivedTimetableBlocks = {
  id: string;
  subject: string;
  location: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
};

export type UserSettings = {
  setting_key: string;
  setting_value: string;
};

export type ConflictBlocks = {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
};
