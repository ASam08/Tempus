import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { useState } from "react";

const COLOUR_STYLES: Record<string, string> = {
  red: "bg-red-600 focus:bg-red-700 dark:bg-red-600 dark:focus:bg-red-700 hover:bg-red-700 dark:hover:bg-red-700",
  blue: "bg-blue-600 focus:bg-blue-700 dark:bg-blue-600 dark:focus:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700",
  green:
    "bg-green-600 focus:bg-green-700 dark:bg-green-600 dark:focus:bg-green-700 hover:bg-green-700 dark:hover:bg-green-700",
  yellow:
    "bg-yellow-600 focus:bg-yellow-700 dark:bg-yellow-600 dark:focus:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-700",
};

const colours = Object.keys(COLOUR_STYLES);

export default function ColourPicker({
  defaultColour,
}: {
  defaultColour: string;
}) {
  const [currentlySelectedColour, setCurrentlySelectedColour] =
    useState(defaultColour);

  const colours = ["red", "blue", "green", "yellow"];

  return (
    <Select
      defaultValue={currentlySelectedColour}
      onValueChange={(value) => {
        if (value) setCurrentlySelectedColour(value);
      }}
    >
      <SelectTrigger className={COLOUR_STYLES[currentlySelectedColour]}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {colours.map((colour) => (
          <SelectItem
            key={colour}
            value={colour}
            className={COLOUR_STYLES[colour]}
          >
            {colour.charAt(0).toUpperCase() + colour.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
