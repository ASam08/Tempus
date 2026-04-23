import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { defaultDaySettings } from "@/lib/defaults";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function dowDefault(
  day: string,
  settings: Record<string, string> | null,
) {
  const result =
    settings?.[day] !== undefined
      ? settings[day] === "true"
      : defaultDaySettings[day];
  return result;
}
