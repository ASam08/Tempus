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

type TimetableSetSelectProps = {
  timetableSets: RetrievedTimetableSets;
  selectedSetId?: string;
};

const REDIRECT_VALUES = new Set(["create-new"])

export default function TimetableSetSelect({
  timetableSets: timetableSets,
  selectedSetId,
}: TimetableSetSelectProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleValueChange(value: string) {
    if (REDIRECT_VALUES.has(value)) {
      router.push("/dashboard/timetable/new-timetable")
      return
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
                  <SelectItem value="create-new">+ Create new</SelectItem>

        </SelectContent>
      </Select>
    </div>
  );
}
