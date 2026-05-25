DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'timetable_sets_owner_id_users_id_fk'
      AND table_name = 'timetable_sets'
  ) THEN
    ALTER TABLE "timetable_sets" ADD CONSTRAINT "timetable_sets_owner_id_users_id_fk"
      FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_user_id_users_id_fk'
      AND table_name = 'user_settings'
  ) THEN
    ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_timetable_sets_user_id_users_id_fk'
      AND table_name = 'user_timetable_sets'
  ) THEN
    ALTER TABLE "user_timetable_sets" ADD CONSTRAINT "user_timetable_sets_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;