import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/data", () => ({
  __esModule: true,
  getUserID: jest.fn(),
  getTimetableSets: jest.fn(),
  getUserSettings: jest.fn(),
}));

jest.mock("@/app/ui/timetable/addtimetableblock", () => ({
  __esModule: true,
  default: ({ settings }: { settings: unknown }) => (
    <div data-testid="add-block-form" data-settings={JSON.stringify(settings)}>
      Add Block Form
    </div>
  ),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

import AddBlockPage from "@/app/dashboard/timetable/add-block/page";

const mockedGetUserID = require("@/lib/data").getUserID;
const mockedGetTimetableSets = require("@/lib/data").getTimetableSets;
const mockedGetUserSettings = require("@/lib/data").getUserSettings;

describe("AddBlockPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const { redirect } = require("next/navigation");
    redirect.mockImplementation(() => {
      throw new Error("REDIRECT");
    });
    mockedGetTimetableSets.mockResolvedValue([]);
    mockedGetUserSettings.mockResolvedValue(null);
  });

  it("redirects to timetable if user is not logged in", async () => {
    mockedGetUserID.mockResolvedValue(null);
    const { redirect } = require("next/navigation");
    await expect(AddBlockPage()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/dashboard/timetable");
  });

  it("redirects to timetable if user has no sets", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetTimetableSets.mockResolvedValue([]);
    const { redirect } = require("next/navigation");
    await expect(AddBlockPage()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/dashboard/timetable");
  });

  it("renders add block form when user is logged in and has sets", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetTimetableSets.mockResolvedValue([{ id: "set1" }]);
    mockedGetUserSettings.mockResolvedValue({ theme: "dark" });
    const result = await AddBlockPage();
    render(result);
    expect(screen.getByText("Add Block Form")).toBeInTheDocument();
  });

  it("passes settings to the form", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetTimetableSets.mockResolvedValue([{ id: "set1" }]);
    mockedGetUserSettings.mockResolvedValue({ theme: "dark" });
    const result = await AddBlockPage();
    render(result);
    const form = screen.getByTestId("add-block-form");
    expect(form).toHaveAttribute(
      "data-settings",
      JSON.stringify({ theme: "dark" }),
    );
  });
});
