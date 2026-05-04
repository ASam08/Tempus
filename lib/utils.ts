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

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
    )
    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
      acc.push(p);
      return acc;
    }, []);
}
