import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { useState } from "react";
import { colourStyles } from "@/lib/constants";

const colours = Object.keys(colourStyles);

export default function ColourPicker({
  defaultColour,
}: {
  defaultColour: string;
}) {
  const [currentlySelectedColour, setCurrentlySelectedColour] =
    useState(defaultColour);

  return (
    <Select
      value={currentlySelectedColour}
      onValueChange={(value) => {
        if (value) setCurrentlySelectedColour(value);
      }}
    >
      <SelectTrigger
        className={` ${colourStyles[currentlySelectedColour]} w-36`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {colours.map((colour) => (
          <SelectItem
            key={colour}
            value={colour}
            className={colourStyles[colour]}
            aria-label={colour.charAt(0).toUpperCase() + colour.slice(1)}
          >
            {colour.charAt(0).toUpperCase() + colour.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
