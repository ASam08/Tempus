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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { addTimetableBlock, BlockState } from "@/lib/actions";
import Link from "next/link";
import { useState, useActionState, useRef } from "react";
import { dowKeyValue } from "@/lib/constants";
import { defaultDaySettings } from "@/lib/defaults";
import { unhideDow } from "@/lib/actions";

export default function AddTimetableBlock({
  settings,
}: {
  settings: Record<string, string> | null;
}) {
  const initialState: BlockState = { message: "", errors: {}, conflicts: [] };
  const [state, formAction] = useActionState<BlockState, FormData>(addTimetableBlock, initialState);
  const [dowHidden, setDowHidden] = useState(false);
  const [day_of_week, setDayOfWeek] = useState("");
  const [showDowAlertDialog, setShowDowAlertDialog] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const dow = dowKeyValue;

  const checkDowHidden = (day: string) => {
    const lowerDay = dow.filter((d) => String(d.dow) === day)[0]?.key;
    setDayOfWeek(dow.filter((d) => String(d.dow) === day)[0]?.label || "");
    const daySettings = settings?.[lowerDay];
    if (daySettings === undefined) {
      setDowHidden(!defaultDaySettings[lowerDay]);
    }
    if (daySettings === "true") {
      setDowHidden(false);
    } else {
      setDowHidden(true);
    }
  };

  const validateForm = (formData: FormData) => {
    const errors: Record<string, string> = {};

    const day = formData.get("day_of_week");
    const subject = formData.get("subject");
    const location = formData.get("location");
    const start = formData.get("start_time");
    const end = formData.get("end_time");

    if (!day) errors.day = "Please select a day";
    if (!subject || String(subject).trim().length === 0) {
      errors.subject = "Subject is required";
    }
    if (!location || String(location).trim().length === 0) {
      errors.location = "Location is required";
    }
    if (!start) errors.start_time = "Start time is required";
    if (!end) errors.end_time = "End time is required";

    if (start && end) {
      const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      if (toMinutes(String(end)) <= toMinutes(String(start))) {
        errors.end_time = "End time must be after start time";
      }
    }

    setClientErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const clearClientErrors = (field: string) => {
    setClientErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  return (
    <form action={formAction} ref={formRef}>
      <div className="pb-4">
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
          Add Timetable Block
        </h1>
        <div className="grid gap-3">
          Fill in the details below to add a new block to your timetable.
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-3">
          <Label>Day</Label>

          <Select
            name="day_of_week"
            onValueChange={(value: string) => checkDowHidden(value)}
            onOpenChange={() => clearClientErrors("day")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a day" />
            </SelectTrigger>

            <SelectContent position="popper">
              {dow.map((day) => (
                <SelectItem key={day.dow} value={String(day.dow)}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div id="day_error" aria-live="polite" aria-atomic="true">
            {state.errors?.day &&
              state.errors.day.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            {clientErrors.day && (
              <p className="text-sm text-red-500">{clientErrors.day}</p>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          <Label>Subject</Label>
          <Input
            type="text"
            id="subject"
            name="subject"
            placeholder="e.g. Maths"
            onChange={() => clearClientErrors("subject")}
          />
          <div id="subject_error" aria-live="polite" aria-atomic="true">
            {state.errors?.subject &&
              state.errors.subject.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            {clientErrors.subject && (
              <p className="text-sm text-red-500">{clientErrors.subject}</p>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          <Label>Location</Label>
          <Input
            type="text"
            id="location"
            name="location"
            placeholder="e.g. Room 101"
            onChange={() => clearClientErrors("location")}
          />
          <div id="location_error" aria-live="polite" aria-atomic="true">
            {state.errors?.location &&
              state.errors.location.map((error: string) => (
                <p className="text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            {clientErrors.location && (
              <p className="text-sm text-red-500">{clientErrors.location}</p>
            )}
          </div>
        </div>
        <div className="flex grid-cols-3 gap-8">
          <div className="grid gap-3">
            <Field className="flex">
              <FieldLabel htmlFor="start-time-picker">Start Time</FieldLabel>
              <Input
                type="time"
                id="start_time"
                name="start_time"
                step="300"
                defaultValue="09:30"
                className="bg-background appearance-none pr-4 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                onChange={() => { clearClientErrors("start_time"); clearClientErrors("end_time")}}
              />
            </Field>
            <div id="start_time_error" aria-live="polite" aria-atomic="true">
              {state.errors?.start_time &&
                state.errors.start_time.map((error: string) => (
                  <p className="text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
              {clientErrors.start_time && (
                <p className="text-sm text-red-500">{clientErrors.start_time}</p>
              )}
            </div>
          </div>
          <div className="grid gap-3">
            <Field className="flex">
              <FieldLabel htmlFor="finish-time-picker">Finish Time</FieldLabel>
              <Input
                type="time"
                id="end_time"
                name="end_time"
                step="300"
                defaultValue="10:30"
                className="bg-background appearance-none pr-4 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                onChange={() => clearClientErrors("end_time")}
              />
            </Field>

          </div>
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
            {clientErrors.end_time && (
              <p className="text-sm text-red-500">{clientErrors.end_time}</p>
            )}

            {state.conflicts?.length > 0 && (
              <p className="text-sm text-red-500">
                Conflict with:
              </p>)}
            {state.conflicts?.map((c) => (
                <p key={c.id} className="text-sm text-red-500">
                  {c.subject} ({c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)})
                </p>
              ))
            }
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-4 py-4">
        <Link href="/dashboard/timetable">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          type="button"
          onClick={() => {
            const form = formRef.current;
            if (!form) return;

            const formData = new FormData(form);
            const isValid = validateForm(formData);
            if (!isValid) return;

            if (dowHidden) {
              setShowDowAlertDialog(true);
            } else {
              formRef.current?.requestSubmit();
            }
          }}
        >
          Save changes
        </Button>
      </div>
      <AlertDialog
        open={showDowAlertDialog}
        onOpenChange={setShowDowAlertDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{day_of_week} is hidden</AlertDialogTitle>
            <AlertDialogDescription>
              This day is currently hidden in your timetable settings. Would you
              like to unhide it now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={async () => {
                if (day_of_week) {
                  await unhideDow(day_of_week.toLowerCase());
                }
                setShowDowAlertDialog(false);
                formRef.current?.requestSubmit();
              }}
            >
              Yes, unhide it
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowDowAlertDialog(false);
                formRef.current?.requestSubmit();
              }}
              variant={"secondary"}
            >
              No, leave it hidden
            </AlertDialogAction>
            <AlertDialogCancel variant={"destructive"}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
