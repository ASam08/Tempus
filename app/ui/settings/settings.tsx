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
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Field, FieldLabel } from "@/components/ui/field";
import { settingsSave, SettingsState } from "@/lib/actions";
import Link from "next/link";
import { LucideCircleQuestionMark } from "lucide-react";
import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import { defaultTimeSettings, defaultDaySettings } from "@/lib/defaults";

export default function SettingsFormClient({
  settings,
}: {
  settings: Record<string, string> | null;
}) {
  const initialState: SettingsState = { message: null, errors: {} };
  const [state, formAction] = useActionState(settingsSave, initialState);
  const [error, setError] = useState<string | null>(null);

  const startTime = settings?.["start_time"] ?? defaultTimeSettings.start_time;
  const endTime = settings?.["end_time"] ?? defaultTimeSettings.end_time;

  const validateTimes = (start: string, end: string) => {
    if (!start || !end) return;

    if (end <= start) {
      setError("End time must be after start time");
    } else {
      setError(null);
    }
  };

  useEffect(() => {
    if (!state) return;

    if (state.message === "success") {
      toast.success("Settings saved successfully!", {
        position: "top-center",
        style: { backgroundColor: "forestgreen" },
      });
    } else if (state.message && state.message !== "success") {
      toast.error("Failed to save settings.", {
        position: "top-center",
        style: { backgroundColor: "red" },
      });
    }
  }, [state?.timestamp]);

  const dow = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <form action={formAction}>
      <div className="pb-4">
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
          Update your settings
        </h1>
        <div className="grid gap-3">
          Fill in the details below to update your settings.
        </div>
      </div>
      <div className="grid gap-6">
        <div className="flex flex-row gap-4">
          <div className="flex flex-col gap-4">
            <Field className="flex">
              <FieldLabel htmlFor="start-time-picker">Start Time</FieldLabel>
              <Input
                type="time"
                id="start_time"
                name="start_time"
                step="3600"
                defaultValue={startTime}
                className="bg-background appearance-none pr-4 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                onChange={(e) =>
                  validateTimes(
                    e.target.value,
                    (
                      document.getElementsByName(
                        "end_time",
                      )[0] as HTMLInputElement
                    )?.value,
                  )
                }
              />
            </Field>
            <div id="start_time_error" aria-live="polite" aria-atomic="true">
              {state.errors?.start_time &&
                state.errors.start_time.map((error: string) => (
                  <p className="text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Field className="flex">
              <FieldLabel htmlFor="end-time-picker">End Time</FieldLabel>
              <Input
                type="time"
                id="end_time"
                name="end_time"
                step="3600"
                defaultValue={endTime}
                className="bg-background appearance-none pr-4 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                onChange={(e) =>
                  validateTimes(
                    (
                      document.getElementsByName(
                        "start_time",
                      )[0] as HTMLInputElement
                    )?.value,
                    e.target.value,
                  )
                }
              />
            </Field>
          </div>

          <div className="">
            <HoverCard openDelay={10} closeDelay={100}>
              <HoverCardTrigger asChild>
                <LucideCircleQuestionMark className="size-4" />
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xl text-xs" side="right">
                Start and End times are used to determine the hours shown on the
                timetable.
              </HoverCardContent>
            </HoverCard>
            <div
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
              {error && (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* this component will have a checkbox for each day of the week that will be set to the valie pulled from settings.{dow} */}
      <div className="">
        <div className="flex flex-col gap-2">
          {dow.map((day) => (
            <div key={day.key} className="flex flex-row gap-4">
              <Checkbox
                id={day.key}
                defaultChecked={
                  settings?.[day.key] !== undefined
                    ? settings[day.key] === "true"
                    : defaultDaySettings[day.key]
                }
              />
              <Label htmlFor={day.key}>{day.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-row gap-4 py-4">
        <Link href="/dashboard/timetable">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={!!error}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
