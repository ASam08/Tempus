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
  defaultColour,
}: {
  defaultColour: TimetableColour;
}) {
  const [currentlySelectedColour, setCurrentlySelectedColour] =
    useState(defaultColour);

  return (
    <Select
      value={currentlySelectedColour}
      onValueChange={(value) => {
        if (value) setCurrentlySelectedColour(value);
      }}
      name="colour"
    >
      <SelectTrigger
        className={` ${colourStyles[currentlySelectedColour]} w-36`}
      >
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
