"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { settingsSave } from "@/lib/actions";
import Link from "next/link";

export default function SettingsFormClient({
  userId,
  startTime,
  endTime,
}: {
  userId: string;
  startTime: string;
  endTime: string;
}) {
  const initialState = { message: null, errors: {} };

  return (
    <form action={settingsSave}>
      <input type="hidden" name="userId" value={userId} />
      <div className="pb-4">
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
          Update your settings
        </h1>
        <div className="grid gap-3">
          Fill in the details below to update your settings.
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <div className="flex flex-col gap-4">
          <Field className="flex">
            <FieldLabel htmlFor="start-time-picker">Start Time</FieldLabel>
            <Input
              type="time"
              id="start_time"
              name="start_time"
              step="900"
              defaultValue={startTime}
              className="bg-background appearance-none pr-4 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </Field>
          {/* <div id="start_time_error" aria-live="polite" aria-atomic="true">
              {state.errors?.start_time &&
                state.errors.start_time.map((error: string) => (
                  <p className="text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div> */}
        </div>
        <div className="flex flex-col gap-4">
          <Field className="flex">
            <FieldLabel htmlFor="finish-time-picker">Finish Time</FieldLabel>
            <Input
              type="time"
              id="end_time"
              name="end_time"
              step="300"
              defaultValue={endTime}
              className="bg-background appearance-none pr-4 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </Field>
        </div>
        {/* <div
            className="grid items-center pt-5"
            id="end_time_error"
            aria-live="polite"
            aria-atomic="true"
          >
            {state.errors?.end_time &&
              state.errors.end_time.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div> */}
      </div>
      <div className="flex flex-row gap-4 py-4">
        <Link href="/dashboard/timetable">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
