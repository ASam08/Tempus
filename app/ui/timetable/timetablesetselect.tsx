"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { RetrievedTimetableSets } from "@/lib/definitions";
import { useRouter, usePathname } from "next/navigation";

type TimetableSetSelectProps = {
  timetableSets: RetrievedTimetableSets;
  selectedSetId?: string;
};

export default function TimetableSetSelect({
  timetableSets: timetableSets,
  selectedSetId,
}: TimetableSetSelectProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleValueChange(value: string) {
    const params = new URLSearchParams();
    params.set("set", value);
    router.push(`${pathname}?${params.toString()}`);
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
        </SelectContent>
      </Select>
    </div>
  );
}
