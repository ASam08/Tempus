jest.mock("@/lib/data", () => ({
  getTimetableSets: jest.fn(),
  getCurrentBlock: jest.fn(),
  getNextBlock: jest.fn(),
  getUserID: jest.fn(),
  getNextBreak: jest.fn(),
  blockConflictCheck: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  sqlConn: {
    insert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    select: jest.fn(),
  },
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_pw"),
}));

jest.mock("@/db/schema", () => ({
  users: "users_table",
  timetableSets: "timetableSets_table",
  timetableBlocks: "timetableBlocks_table",
  userSettings: "userSettings_table",
}));

jest.mock("drizzle-orm", () => ({
  sql: jest.fn((strings: TemplateStringsArray) => strings[0]),
  eq: jest.fn((col: unknown, val: unknown) => ({ col, val })),
  and: jest.fn((...conditions: unknown[]) => ({ conditions })),
}));

jest.mock("@/lib/constants", () => ({
  dow: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ],
}));

jest.mock("@/lib/utils", () => ({
  timeToMinutes: jest.fn((t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }),
}));

import {
  createNewTimetableSet,
  addTimetableBlock,
  updateTimetableBlock,
  fetchCurrentBlock,
  fetchNextBlock,
  fetchNextBreak,
  deleteBlock,
  settingsSave,
  unhideDow,
  updateSettings,
  markSetupComplete,
} from "@/lib/actions";

function mockSelectChain(resolvedValue: unknown = []) {
  const limitMethod = jest.fn().mockResolvedValue(resolvedValue);
  const whereMethod = jest.fn().mockReturnValue({ limit: limitMethod });
  const innerJoinMethod = jest.fn().mockReturnValue({ where: whereMethod });
  const fromMethod = jest.fn().mockReturnValue({ innerJoin: innerJoinMethod });
  (sqlConn.select as jest.Mock).mockReturnValue({ from: fromMethod });
  return { fromMethod, innerJoinMethod, whereMethod, limitMethod };
}

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sqlConn } from "@/lib/db";
import {
  getTimetableSets,
  getCurrentBlock,
  getNextBlock,
  getUserID,
  getNextBreak,
  blockConflictCheck,
} from "@/lib/data";
const mockRevalidatePath = revalidatePath as jest.Mock;
const mockRedirect = redirect as any as jest.Mock;
const mockGetUserID = getUserID as jest.Mock;
const mockGetTimetableSets = getTimetableSets as jest.Mock;
const mockGetCurrentBlock = getCurrentBlock as jest.Mock;
const mockGetNextBlock = getNextBlock as jest.Mock;
const mockGetNextBreak = getNextBreak as jest.Mock;
const mockBlockConflictCheck = blockConflictCheck as jest.Mock;

function mockInsertChain(resolvedValue: unknown = undefined) {
  const valuesMethod = jest.fn().mockResolvedValue(resolvedValue);
  (sqlConn.insert as jest.Mock).mockReturnValue({ values: valuesMethod });
  return { valuesMethod };
}

function mockInsertWithConflictChain(resolvedValue: unknown = undefined) {
  const onConflictMethod = jest.fn().mockResolvedValue(resolvedValue);
  const valuesMethod = jest
    .fn()
    .mockReturnValue({ onConflictDoUpdate: onConflictMethod });
  (sqlConn.insert as jest.Mock).mockReturnValue({ values: valuesMethod });
  return { valuesMethod, onConflictMethod };
}

function mockDeleteChain(resolvedValue: unknown = undefined) {
  const whereMethod = jest.fn().mockResolvedValue(resolvedValue);
  (sqlConn.delete as jest.Mock).mockReturnValue({ where: whereMethod });
  return { whereMethod };
}

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

describe("ActionsTests", () => {
  describe("createNewTimetableSet", () => {
    const validForm = makeFormData({ title: "My Set", description: "desc" });

    beforeEach(() => {
      mockGetUserID.mockResolvedValue("user-uuid");
    });

    it("inserts set, revalidates, and redirects on success", async () => {
      mockInsertChain();
      await expect(createNewTimetableSet(undefined, validForm)).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      expect(sqlConn.insert).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/timetable");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/timetable");
    });

    it("inserts with the provided description when one is given", async () => {
      mockInsertChain();
      const form = makeFormData({
        title: "My Set",
        description: "a description",
      });
      await expect(createNewTimetableSet(undefined, form)).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      const valuesCalled = (sqlConn.insert as jest.Mock).mock.results[0].value
        .values;
      expect(valuesCalled).toHaveBeenCalledWith(
        expect.objectContaining({ description: "a description" }),
      );
    });

    it("inserts with null description when none is provided", async () => {
      mockInsertChain();
      const form = makeFormData({ title: "My Set" });
      await expect(createNewTimetableSet(undefined, form)).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      const valuesCalled = (sqlConn.insert as jest.Mock).mock.results[0].value
        .values;
      expect(valuesCalled).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
      );
    });

    it("returns validation error when title is empty", async () => {
      const form = makeFormData({ title: "", description: "" });
      const result = await createNewTimetableSet(undefined, form);
      expect(result).toMatchObject({ errors: expect.any(Object) });
      expect(sqlConn.insert).not.toHaveBeenCalled();
    });

    it("returns error object when DB insert throws", async () => {
      (sqlConn.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockRejectedValueOnce(new Error("db error")),
      });
      const result = await createNewTimetableSet(undefined, validForm);
      expect(result).toMatchObject({
        message: "Error creating timetable set.",
      });
    });
  });

  describe("addTimetableBlock", () => {
    const initialState = { errors: {}, message: "", conflicts: [] };
    const validForm = makeFormData({
      day_of_week: "2",
      subject: "Math",
      location: "Room 1",
      start_time: "09:00",
      end_time: "10:00",
    });

    beforeEach(() => {
      mockGetUserID.mockResolvedValue("user-uuid");
      mockGetTimetableSets.mockResolvedValue([{ id: "set-uuid" }]);
      mockBlockConflictCheck.mockResolvedValue([]);
    });

    it("inserts block, revalidates, and redirects on success", async () => {
      mockInsertChain();
      await expect(addTimetableBlock(initialState, validForm)).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      expect(mockBlockConflictCheck).toHaveBeenCalledWith(
        "set-uuid",
        2,
        "09:00",
        "10:00",
      );
      expect(sqlConn.insert).toHaveBeenCalled();
    });

    it("returns no-user sentinel when getUserID returns null", async () => {
      mockGetUserID.mockResolvedValueOnce(null);
      const result = await addTimetableBlock(initialState, validForm);
      expect(result).toMatchObject({
        message: expect.stringContaining("not authenticated"),
      });
    });

    it("returns validation errors when fields are missing", async () => {
      const form = makeFormData({
        day_of_week: "0",
        subject: "",
        location: "",
        start_time: "",
        end_time: "",
      });
      const result = await addTimetableBlock(initialState, form);
      expect(result).toMatchObject({ errors: expect.any(Object) });
      expect(sqlConn.insert).not.toHaveBeenCalled();
    });

    it("returns validation error when end_time is before start_time", async () => {
      const form = makeFormData({
        day_of_week: "2",
        subject: "Math",
        location: "Room 1",
        start_time: "10:00",
        end_time: "09:00",
      });
      const result = await addTimetableBlock(initialState, form);
      expect(result?.errors).toHaveProperty("end_time");
    });

    it("returns conflict error when blockConflictCheck returns conflicts", async () => {
      mockBlockConflictCheck.mockResolvedValueOnce([{ id: "conflict-block" }]);
      const result = await addTimetableBlock(initialState, validForm);
      expect(result).toMatchObject({
        message: "Time conflict with existing block(s)",
        conflicts: [{ id: "conflict-block" }],
      });
      expect(sqlConn.insert).not.toHaveBeenCalled();
    });

    it("returns error when blockConflictCheck returns null", async () => {
      mockBlockConflictCheck.mockResolvedValueOnce(null);
      const result = await addTimetableBlock(initialState, validForm);
      expect(result).toMatchObject({ message: "Error checking conflicts" });
    });

    it("returns error object when DB insert throws", async () => {
      (sqlConn.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockRejectedValueOnce(new Error("db error")),
      });
      const result = await addTimetableBlock(initialState, validForm);
      expect(result).toMatchObject({
        message: "Error creating timetable block.",
      });
    });
  });

  describe("updateTimetableBlock", () => {
    const initialState = { errors: {}, message: "", conflicts: [] };
    const validForm = makeFormData({
      id: "block-uuid",
      day_of_week: "2",
      subject: "Math",
      location: "Room 1",
      start_time: "09:00",
      end_time: "10:00",
    });

    beforeEach(() => {
      mockGetUserID.mockResolvedValue("user-uuid");
      mockBlockConflictCheck.mockResolvedValue([]);
    });

    it("updates block, revalidates, and redirects on success", async () => {
      mockSelectChain([{ timetableSetId: "set-uuid" }]);
      const setMethod = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (sqlConn.update as jest.Mock).mockReturnValue({ set: setMethod });

      await expect(
        updateTimetableBlock("block-uuid", initialState, validForm),
      ).rejects.toThrow("NEXT_REDIRECT");
      expect(sqlConn.update).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/timetable");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/timetable");
    });

    it("returns not-authenticated when getUserID returns null", async () => {
      mockGetUserID.mockResolvedValueOnce(null);
      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        validForm,
      );
      expect(result).toMatchObject({
        message: expect.stringContaining("not authenticated"),
      });
    });

    it("returns error when select query throws", async () => {
      const limitMethod = jest.fn().mockRejectedValue(new Error("db error"));
      const whereMethod = jest.fn().mockReturnValue({ limit: limitMethod });
      const innerJoinMethod = jest.fn().mockReturnValue({ where: whereMethod });
      const fromMethod = jest
        .fn()
        .mockReturnValue({ innerJoin: innerJoinMethod });
      (sqlConn.select as jest.Mock).mockReturnValue({ from: fromMethod });

      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        validForm,
      );
      expect(result).toMatchObject({
        message: "Error fetching timetable set for block update.",
      });
    });

    it("returns error when no set is found for the block", async () => {
      mockSelectChain([]);
      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        validForm,
      );
      expect(result).toMatchObject({
        message: "No timetable set found for block update.",
      });
    });

    it("returns validation errors when fields are invalid", async () => {
      mockSelectChain([{ timetableSetId: "set-uuid" }]);
      const form = makeFormData({
        id: "block-uuid",
        day_of_week: "0",
        subject: "",
        location: "",
        start_time: "",
        end_time: "",
      });
      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        form,
      );
      expect(result).toMatchObject({ errors: expect.any(Object) });
      expect(sqlConn.update).not.toHaveBeenCalled();
    });

    it("returns validation error when end_time is before start_time", async () => {
      mockSelectChain([{ timetableSetId: "set-uuid" }]);
      const form = makeFormData({
        id: "block-uuid",
        day_of_week: "2",
        subject: "Math",
        location: "Room 1",
        start_time: "10:00",
        end_time: "09:00",
      });
      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        form,
      );
      expect(result?.errors).toHaveProperty("end_time");
    });

    it("returns conflict error when blockConflictCheck returns conflicts", async () => {
      mockSelectChain([{ timetableSetId: "set-uuid" }]);
      mockBlockConflictCheck.mockResolvedValueOnce([{ id: "conflict-block" }]);
      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        validForm,
      );
      expect(result).toMatchObject({
        message: "Time conflict with existing block(s)",
        conflicts: [{ id: "conflict-block" }],
      });
      expect(sqlConn.update).not.toHaveBeenCalled();
    });

    it("returns error when blockConflictCheck returns null", async () => {
      mockSelectChain([{ timetableSetId: "set-uuid" }]);
      mockBlockConflictCheck.mockResolvedValueOnce(null);
      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        validForm,
      );
      expect(result).toMatchObject({ message: "Error checking conflicts" });
    });

    it("passes current_block_id to blockConflictCheck to exclude itself", async () => {
      mockSelectChain([{ timetableSetId: "set-uuid" }]);
      const setMethod = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (sqlConn.update as jest.Mock).mockReturnValue({ set: setMethod });

      await expect(
        updateTimetableBlock("block-uuid", initialState, validForm),
      ).rejects.toThrow("NEXT_REDIRECT");
      expect(mockBlockConflictCheck).toHaveBeenCalledWith(
        "set-uuid",
        2,
        "09:00",
        "10:00",
        "block-uuid",
      );
    });

    it("returns error when DB update throws", async () => {
      mockSelectChain([{ timetableSetId: "set-uuid" }]);
      const setMethod = jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error("db error")),
      });
      (sqlConn.update as jest.Mock).mockReturnValue({ set: setMethod });

      const result = await updateTimetableBlock(
        "block-uuid",
        initialState,
        validForm,
      );
      expect(result).toMatchObject({
        message: "Error updating timetable block.",
      });
    });
  });

  describe("fetchCurrentBlock", () => {
    it("returns no-user sentinel when getUserID returns null", async () => {
      mockGetUserID.mockResolvedValueOnce(null);
      const result = await fetchCurrentBlock(1, "09:00");
      expect(result).toEqual({ reason: "no-user" });
    });

    it("returns no-set sentinel when getTimetableSets returns empty array", async () => {
      mockGetUserID.mockResolvedValueOnce("user-uuid");
      mockGetTimetableSets.mockResolvedValueOnce([]);
      const result = await fetchCurrentBlock(1, "09:00");
      expect(result).toEqual({ reason: "no-set" });
    });

    it("delegates to getCurrentBlock with correct args", async () => {
      mockGetUserID.mockResolvedValueOnce("user-uuid");
      mockGetTimetableSets.mockResolvedValueOnce([{ id: "set-uuid" }]);
      mockGetCurrentBlock.mockResolvedValueOnce({ id: "block-1" });

      const result = await fetchCurrentBlock(3, "11:30");

      expect(mockGetCurrentBlock).toHaveBeenCalledWith("set-uuid", 3, "11:30");
      expect(result).toEqual({ id: "block-1" });
    });
  });

  describe("fetchNextBlock", () => {
    it("returns no-user sentinel when getUserID returns null", async () => {
      mockGetUserID.mockResolvedValueOnce(null);
      expect(await fetchNextBlock(1, "09:00")).toEqual({ reason: "no-user" });
    });

    it("returns no-set sentinel when getTimetableSets returns empty array", async () => {
      mockGetUserID.mockResolvedValueOnce("user-uuid");
      mockGetTimetableSets.mockResolvedValueOnce([]);
      expect(await fetchNextBlock(1, "09:00")).toEqual({ reason: "no-set" });
    });

    it("delegates to getNextBlock with correct args", async () => {
      mockGetUserID.mockResolvedValueOnce("user-uuid");
      mockGetTimetableSets.mockResolvedValueOnce([{ id: "set-uuid" }]);
      mockGetNextBlock.mockResolvedValueOnce({ id: "block-2" });

      const result = await fetchNextBlock(4, "14:00");

      expect(mockGetNextBlock).toHaveBeenCalledWith("set-uuid", 4, "14:00");
      expect(result).toEqual({ id: "block-2" });
    });
  });

  describe("fetchNextBreak", () => {
    it("returns no-user sentinel when getUserID returns null", async () => {
      mockGetUserID.mockResolvedValueOnce(null);
      expect(await fetchNextBreak(1, "09:00")).toEqual({ reason: "no-user" });
    });

    it("returns no-set sentinel when getTimetableSets returns empty array", async () => {
      mockGetUserID.mockResolvedValueOnce("user-uuid");
      mockGetTimetableSets.mockResolvedValueOnce([]);
      expect(await fetchNextBreak(1, "09:00")).toEqual({ reason: "no-set" });
    });

    it("delegates to getNextBreak with correct args", async () => {
      mockGetUserID.mockResolvedValueOnce("user-uuid");
      mockGetTimetableSets.mockResolvedValueOnce([{ id: "set-uuid" }]);
      mockGetNextBreak.mockResolvedValueOnce({
        startTime: "12:00",
        endTime: "13:00",
      });

      const result = await fetchNextBreak(5, "10:00");

      expect(mockGetNextBreak).toHaveBeenCalledWith("set-uuid", 5, "10:00");
      expect(result).toEqual({ startTime: "12:00", endTime: "13:00" });
    });
  });

  describe("deleteBlock", () => {
    it("deletes the block and revalidates path", async () => {
      mockDeleteChain();
      await deleteBlock("block-abc");
      expect(sqlConn.delete).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/timetable");
    });

    it("returns error object when DB delete throws", async () => {
      (sqlConn.delete as jest.Mock).mockReturnValueOnce({
        where: jest.fn().mockRejectedValueOnce(new Error("delete failed")),
      });
      const result = await deleteBlock("block-abc");
      expect(result).toMatchObject({ message: "Error deleting block" });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("settingsSave", () => {
    const initialState = { message: "" };

    function makeSettingsForm(
      overrides: Record<string, string> = {},
    ): FormData {
      return makeFormData({
        start_time: "08:00",
        end_time: "17:00",
        monday: "true",
        tuesday: "true",
        wednesday: "",
        thursday: "",
        friday: "true",
        saturday: "",
        sunday: "",
        ...overrides,
      });
    }

    beforeEach(() => {
      mockGetUserID.mockResolvedValue("user-uuid");
    });

    it("returns not-authenticated when getUserID returns null", async () => {
      mockGetUserID.mockResolvedValueOnce(null);
      const result = await settingsSave(initialState, makeSettingsForm());
      expect(result).toMatchObject({ message: "User not authenticated." });
    });

    it("returns validation errors when end_time is before start_time", async () => {
      const result = await settingsSave(
        initialState,
        makeSettingsForm({ start_time: "17:00", end_time: "08:00" }),
      );
      expect(result).toMatchObject({ errors: { end_time: expect.any(Array) } });
    });

    it("calls updateSettings and revalidates on success", async () => {
      const { onConflictMethod } = mockInsertWithConflictChain();

      const result = await settingsSave(initialState, makeSettingsForm());

      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/settings");
      expect(result).toMatchObject({
        message: "success",
        timestamp: expect.any(Number),
      });
    });
  });

  describe("unhideDow", () => {
    it("returns not-authenticated when getUserID returns null", async () => {
      mockGetUserID.mockResolvedValueOnce(null);
      const result = await unhideDow("monday");
      expect(result).toMatchObject({ message: "User not authenticated." });
    });

    it("calls updateSettings with the correct day key set to true and revalidates", async () => {
      mockGetUserID.mockResolvedValueOnce("user-uuid");
      const { onConflictMethod } = mockInsertWithConflictChain();

      await unhideDow("wednesday");

      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/settings");
      const insertMock = sqlConn.insert as jest.Mock;
      const valuesCalled = insertMock.mock.results[0].value.values;
      expect(valuesCalled).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            settingKey: "wednesday",
            settingValue: "true",
          }),
        ]),
      );
    });
  });

  describe("updateSettings", () => {
    it("returns early (undefined) when all data entries are filtered out", async () => {
      const result = await updateSettings("user-uuid", [
        ["unknown_key", "value"],
      ]);
      expect(result).toBeUndefined();
      expect(sqlConn.insert).not.toHaveBeenCalled();
    });

    it("upserts only allowed setting keys", async () => {
      const { onConflictMethod } = mockInsertWithConflictChain();

      const result = await updateSettings("user-uuid", [
        ["start_time", "08:00"],
        ["end_time", "17:00"],
        ["monday", "true"],
        ["bad_key", "should_be_ignored"],
      ]);

      expect(result).toEqual({ message: "success", errors: {} });
      const insertMock = sqlConn.insert as jest.Mock;
      const valuesCalled = insertMock.mock.results[0].value.values;
      expect(valuesCalled).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ settingKey: "start_time" }),
          expect.objectContaining({ settingKey: "end_time" }),
          expect.objectContaining({ settingKey: "monday" }),
        ]),
      );
      const rows: Array<{ settingKey: string }> = valuesCalled.mock.calls[0][0];
      expect(rows.map((r) => r.settingKey)).not.toContain("bad_key");
    });

    it("returns error object when DB upsert throws", async () => {
      (sqlConn.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest
            .fn()
            .mockRejectedValueOnce(new Error("db error")),
        }),
      });

      const result = await updateSettings("user-uuid", [["monday", "true"]]);
      expect(result).toMatchObject({ message: "Error updating settings" });
    });

    it("accepts all seven day-of-week keys", async () => {
      const { onConflictMethod } = mockInsertWithConflictChain();

      const days: [string, string][] = [
        ["monday", "true"],
        ["tuesday", "false"],
        ["wednesday", "true"],
        ["thursday", "false"],
        ["friday", "true"],
        ["saturday", "false"],
        ["sunday", "true"],
      ];

      const result = await updateSettings("user-uuid", days);
      expect(result).toEqual({ message: "success", errors: {} });
    });
  });

  describe("markSetupComplete", () => {
    it("returns an empty object on success", async () => {
      const setMethod = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (sqlConn.update as jest.Mock).mockReturnValue({ set: setMethod });

      const result = await markSetupComplete("user-uuid");

      expect(result).toEqual({});
      expect(sqlConn.update).toHaveBeenCalled();
    });

    it("returns an error object when the DB update throws", async () => {
      const setMethod = jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error("db error")),
      });
      (sqlConn.update as jest.Mock).mockReturnValue({ set: setMethod });

      const result = await markSetupComplete("user-uuid");

      expect(result).toEqual({
        error: "Something went wrong. Please try again.",
      });
    });
  });
});
