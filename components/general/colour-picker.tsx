import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { useState } from "react";
import { colourStyles, timetableColours } from "@/lib/constants";
import { TimetableColour } from "@/lib/definitions";

export default function ColourPicker({
  value,
  onValueChange,
}: {
  value: TimetableColour;
  onValueChange: (value: TimetableColour) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        if (newValue) onValueChange(newValue);
      }}
      name="colour"
    >
      <SelectTrigger className={`${colourStyles[value]} w-36`}>
        <SelectValue className="capitalize" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {timetableColours.map((colour) => (
          <SelectItem
            key={colour}
            value={colour}
            className={` ${colourStyles[colour]} capitalize`}
          >
            {colour}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
