jest.mock("@/lib/defaults", () => ({
  defaultDaySettings: {
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true,
  },
}));

import { cn, timeToMinutes, dowDefault } from "@/lib/utils";
import { defaultDaySettings } from "@/lib/defaults";

describe("utils", () => {
  describe("cn", () => {
    it("merges conflicting Tailwind classes, keeping the last", () => {
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("passes through non-conflicting classes unchanged", () => {
      expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
    });

    it("filters falsy values", () => {
      expect(cn(undefined, null, false, "p-4")).toBe("p-4");
    });

    it("returns empty string with no arguments", () => {
      expect(cn()).toBe("");
    });
  });

  describe("timeToMinutes", () => {
    it("converts HH:MM:SS strings correctly", () => {
      expect(timeToMinutes("14:30:00")).toBe(870);
      expect(timeToMinutes("00:00:00")).toBe(0);
      expect(timeToMinutes("23:59:59")).toBe(1439);
    });

    it("returns null for null, undefined, and empty string", () => {
      expect(timeToMinutes(null)).toBeNull();
      expect(timeToMinutes(undefined)).toBeNull();
      expect(timeToMinutes("")).toBeNull();
    });
  });

  describe("dowDefault", () => {
    const settings = { Monday: "true", Tuesday: "false" };

    it("returns true when settings value is the string 'true'", () => {
      expect(dowDefault("Monday", settings)).toBe(true);
    });

    it("returns false when settings value is the string 'false'", () => {
      expect(dowDefault("Tuesday", settings)).toBe(false);
    });

    it("falls back to defaultDaySettings when the day is absent from settings", () => {
      expect(dowDefault("Wednesday", settings)).toBe(
        defaultDaySettings["Wednesday"],
      );
    });

    it("falls back to defaultDaySettings when settings is null", () => {
      expect(dowDefault("Thursday", null)).toBe(defaultDaySettings["Thursday"]);
    });
  });

  describe("getPaginationItems", () => {
    const { getPaginationItems } = require("@/lib/utils");

    it("returns correct pagination items for middle page", () => {
      expect(getPaginationItems(5, 10)).toEqual([
        1,
        "ellipsis",
        4,
        5,
        6,
        "ellipsis",
        10,
      ]);
    });

    it("returns correct pagination items for first page", () => {
      expect(getPaginationItems(1, 5)).toEqual([1, 2, "ellipsis", 5]);
    });

    it("returns correct pagination items for last page", () => {
      expect(getPaginationItems(5, 5)).toEqual([1, "ellipsis", 4, 5]);
    });

    it("returns all pages when totalPages is small", () => {
      expect(getPaginationItems(2, 3)).toEqual([1, 2, 3]);
    });

    it("handles edge case of currentPage near start", () => {
      expect(getPaginationItems(2, 10)).toEqual([1, 2, 3, "ellipsis", 10]);
    });

    it("handles edge case of currentPage near end", () => {
      expect(getPaginationItems(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
    });

    it("returns all pages when totalPages is 2", () => {
      expect(getPaginationItems(1, 2)).toEqual([1, 2]);
    });

    it("returns all pages when on first page of 3", () => {
      expect(getPaginationItems(1, 3)).toEqual([1, 2, 3]);
    });

    it("handles totalPages of 1", () => {
      expect(getPaginationItems(1, 1)).toEqual([1]);
    });

    it("handles totalPages of 0", () => {
      expect(getPaginationItems(1, 0)).toEqual([]);
    });
  });
});
