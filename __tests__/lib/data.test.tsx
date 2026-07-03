import "@testing-library/jest-dom";

jest.mock("@/lib/db", () => {
  const mockLimit = jest.fn().mockResolvedValue([]);
  const mockOrderBy = jest.fn(() => ({ limit: mockLimit }));
  const mockWhere = jest.fn(() => ({ limit: mockLimit, orderBy: mockOrderBy }));
  const mockLeftJoin = jest.fn(() => ({ where: mockWhere }));
  const mockInnerJoin = jest.fn(() => ({ where: mockWhere }));
  const mockFrom = jest.fn(() => ({
    where: mockWhere,
    limit: mockLimit,
    leftJoin: mockLeftJoin,
    innerJoin: mockInnerJoin,
  }));
  const mockSelect = jest.fn(() => ({ from: mockFrom }));
  const mockSelectDistinct = jest.fn(() => ({ from: mockFrom }));

  return {
    DATABASE_URL: "postgres://dummy:dummy@dummy:5432/dummy",
    sqlConn: {
      select: mockSelect,
      selectDistinct: mockSelectDistinct,
    },
    __mocks: {
      mockLimit,
      mockOrderBy,
      mockWhere,
      mockFrom,
      mockLeftJoin,
      mockInnerJoin,
      mockSelect,
      mockSelectDistinct,
    },
  };
});

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

import {
  getUserID,
  getAllTimetableSets,
  getTimetableBlocks,
  getCurrentBlock,
  getNextBlock,
  getNextBreak,
  getUserSettings,
  blockConflictCheck,
  getBlockByID,
} from "@/lib/data";

const {
  mockLimit,
  mockOrderBy,
  mockWhere,
  mockFrom,
  mockLeftJoin,
  mockInnerJoin,
  mockSelect,
  mockSelectDistinct,
} = require("@/lib/db").__mocks;

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});

  mockLimit.mockResolvedValue([]);
  mockOrderBy.mockReturnValue({ limit: mockLimit });
  mockWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });
  mockLeftJoin.mockReturnValue({ where: mockWhere });
  mockFrom.mockReturnValue({
    where: mockWhere,
    limit: mockLimit,
    leftJoin: mockLeftJoin,
    innerJoin: mockInnerJoin,
  });
  mockInnerJoin.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });
  mockSelectDistinct.mockReturnValue({ from: mockFrom });

  // Re-apply after resetAllMocks wipes implementations
  const { auth } = require("@/lib/auth");
  auth.api.getSession = jest.fn();
});

describe("DataTests", () => {
  describe("getUserID", () => {
    it("returns the user ID from the session", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValueOnce({ user: { id: "user-123" } });
      const result = await getUserID();
      expect(result).toBe("user-123");
    });

    it("returns null when there is no session", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValueOnce(null);
      const result = await getUserID();
      expect(result).toBeNull();
    });

    it("returns null when session has no user id", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValueOnce({ user: {} });
      const result = await getUserID();
      expect(result).toBeNull();
    });
  });

  describe("getAllTimetableSets", () => {
    it("returns timetable sets for a user", async () => {
      const fakeSets = [{ id: "set-123" }];
      mockLimit.mockResolvedValueOnce(fakeSets);
      const result = await getAllTimetableSets("user-123");
      expect(result).toEqual(fakeSets);
    });

    it("returns empty array when there are no sets", async () => {
      mockLimit.mockResolvedValueOnce([]);
      const result = await getAllTimetableSets("user-123");
      expect(result).toEqual([]);
    });

    it("returns empty array when the database throws", async () => {
      mockLimit.mockRejectedValueOnce(new Error("DB error"));
      const result = await getAllTimetableSets("user-123");
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getTimetableBlocks", () => {
    it("returns blocks for a timetable set", async () => {
      const fakeBlocks = [
        {
          id: "block-1",
          start_time: "09:00",
          end_time: "10:00",
          day_of_week: 1,
          subject: "Maths",
          location: "Room 1",
        },
      ];
      mockFrom.mockReturnValueOnce({ where: mockWhere });
      mockWhere.mockResolvedValueOnce(fakeBlocks);
      const result = await getTimetableBlocks("set-123");
      expect(result).toEqual(fakeBlocks);
    });

    it("returns empty array when there are no blocks", async () => {
      mockFrom.mockReturnValueOnce({ where: mockWhere });
      mockWhere.mockResolvedValueOnce([]);
      const result = await getTimetableBlocks("set-123");
      expect(result).toEqual([]);
    });

    it("returns empty array when the database throws", async () => {
      mockFrom.mockReturnValueOnce({ where: mockWhere });
      mockWhere.mockRejectedValueOnce(new Error("DB error"));
      const result = await getTimetableBlocks("set-123");
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getCurrentBlock", () => {
    it("returns the current block", async () => {
      const fakeBlock = {
        id: "block-1",
        start_time: "09:00",
        end_time: "10:00",
        day_of_week: 1,
        subject: "Maths",
        location: "Room 1",
      };
      mockLimit.mockResolvedValueOnce([fakeBlock]);
      const result = await getCurrentBlock("set-123", 1, "09:30");
      expect(result).toEqual(fakeBlock);
    });

    it("returns null when no block is active", async () => {
      mockLimit.mockResolvedValueOnce([]);
      const result = await getCurrentBlock("set-123", 1, "09:30");
      expect(result).toBeNull();
    });

    it("throws when the database throws", async () => {
      mockLimit.mockRejectedValueOnce(new Error("DB error"));
      await expect(getCurrentBlock("set-123", 1, "09:30")).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("getNextBlock", () => {
    it("returns the next block", async () => {
      const fakeBlock = {
        id: "block-2",
        start_time: "10:00",
        end_time: "11:00",
        day_of_week: 1,
        subject: "English",
        location: "Room 2",
      };
      mockLimit.mockResolvedValueOnce([fakeBlock]);
      const result = await getNextBlock("set-123", 1, "09:30");
      expect(result).toEqual(fakeBlock);
    });

    it("returns null when there is no next block", async () => {
      mockLimit.mockResolvedValueOnce([]);
      const result = await getNextBlock("set-123", 1, "09:30");
      expect(result).toBeNull();
    });

    it("throws when the database throws", async () => {
      mockLimit.mockRejectedValueOnce(new Error("DB error"));
      await expect(getNextBlock("set-123", 1, "09:30")).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("getNextBreak", () => {
    it("returns the next break block", async () => {
      const fakeBlock = {
        id: "block-3",
        start_time: "10:00",
        end_time: "11:30",
        day_of_week: 1,
        subject: "Science",
        location: "Room 3",
      };
      mockLimit.mockResolvedValueOnce([fakeBlock]);
      const result = await getNextBreak("set-123", 1, "09:30");
      expect(result).toEqual(fakeBlock);
    });

    it("returns null when there is no break", async () => {
      mockLimit.mockResolvedValueOnce([]);
      const result = await getNextBreak("set-123", 1, "09:30");
      expect(result).toBeNull();
    });

    it("throws when the database throws", async () => {
      mockLimit.mockRejectedValueOnce(new Error("DB error"));
      await expect(getNextBreak("set-123", 1, "09:30")).rejects.toThrow(
        "DB error",
      );
    });

    it("uses the leftJoin chain to find a break block", async () => {
      const fakeBlock = {
        id: "block-4",
        start_time: "12:00",
        end_time: "13:00",
        day_of_week: 2,
        subject: "Art",
        location: "Room 4",
      };
      // getNextBreak resolves via .limit() at the end of the leftJoin chain
      mockLimit.mockResolvedValueOnce([fakeBlock]);
      const result = await getNextBreak("set-123", 2, "11:30");
      expect(result).toEqual(fakeBlock);
      expect(mockLeftJoin).toHaveBeenCalled();
    });
  });

  describe("getUserSettings", () => {
    it("returns settings as a key-value object", async () => {
      const fakeRows = [
        { setting_key: "start_time", setting_value: "09:00" },
        { setting_key: "end_time", setting_value: "17:00" },
      ];
      mockFrom.mockReturnValueOnce({ where: mockWhere });
      mockWhere.mockResolvedValueOnce(fakeRows);
      const result = await getUserSettings("user-123");
      expect(result).toEqual({
        start_time: "09:00",
        end_time: "17:00",
      });
    });

    it("returns empty object when there are no settings", async () => {
      mockFrom.mockReturnValueOnce({ where: mockWhere });
      mockWhere.mockResolvedValueOnce([]);
      const result = await getUserSettings("user-123");
      expect(result).toEqual({});
    });

    it("returns null when the database throws", async () => {
      mockFrom.mockReturnValueOnce({ where: mockWhere });
      mockWhere.mockRejectedValueOnce(new Error("DB error"));
      const result = await getUserSettings("user-123");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("blockConflictCheck", () => {
    it("returns conflicting blocks", async () => {
      const fakeConflicts = [
        {
          id: "block-1",
          subject: "Maths",
          start_time: "09:00",
          end_time: "10:00",
        },
      ];
      mockOrderBy.mockResolvedValueOnce(fakeConflicts);
      const result = await blockConflictCheck("set-123", 1, "09:00", "10:00");
      expect(result).toEqual(fakeConflicts);
    });

    it("returns empty array when there are no conflicts", async () => {
      mockOrderBy.mockResolvedValueOnce([]);
      const result = await blockConflictCheck("set-123", 1, "09:00", "10:00");
      expect(result).toEqual([]);
    });

    it("returns null when the database throws", async () => {
      mockOrderBy.mockRejectedValueOnce(new Error("DB error"));
      const result = await blockConflictCheck("set-123", 1, "09:00", "10:00");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it("excludes the current block when current_block_id is provided", async () => {
      mockOrderBy.mockResolvedValueOnce([]);
      const result = await blockConflictCheck(
        "set-123",
        1,
        "09:00",
        "10:00",
        "block-1",
      );
      expect(result).toEqual([]);
      expect(mockWhere).toHaveBeenCalled();
    });

    it("does not exclude any block when current_block_id is omitted", async () => {
      mockOrderBy.mockResolvedValueOnce([]);
      const result = await blockConflictCheck("set-123", 1, "09:00", "10:00");
      expect(result).toEqual([]);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("getBlockByID", () => {
    it("returns the block when found", async () => {
      const fakeBlock = {
        id: "block-1",
        start_time: "09:00",
        end_time: "10:00",
        day_of_week: 1,
        subject: "Maths",
        location: "Room 1",
      };
      mockLimit.mockResolvedValueOnce([fakeBlock]);
      const result = await getBlockByID("block-1", "user-123");
      expect(result).toEqual(fakeBlock);
      expect(mockInnerJoin).toHaveBeenCalled();
    });

    it("returns null when no block is found", async () => {
      mockLimit.mockResolvedValueOnce([]);
      const result = await getBlockByID("block-1", "user-123");
      expect(result).toBeNull();
    });

    it("returns null when the database throws", async () => {
      mockLimit.mockRejectedValueOnce(new Error("DB error"));
      const result = await getBlockByID("block-1", "user-123");
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
