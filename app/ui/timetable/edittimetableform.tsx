"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditTimetable({
  action,
  currentTimetable,
}: {
  action: (prevState: any, formData: FormData) => Promise<any>;
  currentTimetable: { id: string; title: string; description: string | null };
}) {
  const initialState = {};
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
        Edit Timetable
      </h1>
      <div className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="title">Title</Label>
          <Input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={currentTimetable.title}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Add a description"
            defaultValue={currentTimetable.description || ""}
          />
        </div>
      </div>
      <div className="flex flex-row gap-4 py-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/timetable">Cancel</Link>
        </Button>
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
