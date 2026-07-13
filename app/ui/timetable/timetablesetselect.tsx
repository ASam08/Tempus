"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { RetrievedTimetableSets } from "@/lib/definitions";
import { useRouter, usePathname } from "next/navigation";
import { setLastTimetableSet } from "@/lib/actions";
import { LucidePlus, LucideSettings } from "lucide-react";

type TimetableSetSelectProps = {
  timetableSets: RetrievedTimetableSets;
  selectedSetId?: string;
};

const REDIRECT_VALUES = new Set(["create-new", "manage"]);

export default function TimetableSetSelect({
  timetableSets: timetableSets,
  selectedSetId,
}: TimetableSetSelectProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleValueChange(value: string) {
    if (REDIRECT_VALUES.has(value)) {
      switch (value) {
        case "create-new":
          router.push("/dashboard/timetable/new-timetable");
          return;
        case "manage":
          router.push("/dashboard/timetable/manage");
          return;
      }
    }
    const params = new URLSearchParams();
    params.set("set", value);
    router.push(`${pathname}?${params.toString()}`);
    setLastTimetableSet(value);
  }

  return (
    <div>
      <Select onValueChange={handleValueChange} value={selectedSetId}>
        <SelectTrigger className="w-45">
          <SelectValue placeholder="Select a timetable" />
        </SelectTrigger>
        <SelectContent>
          {timetableSets?.map((set) => (
            <SelectItem key={set.id} value={set.id}>
              {set.title}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value="create-new">
            <LucidePlus /> Create new
          </SelectItem>
          <SelectItem value="manage">
            <LucideSettings /> Manage timetables
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
