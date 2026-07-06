import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

jest.mock("@/lib/data", () => ({
  getAllTimetableSets: jest.fn(),
  checkTimetableSetOwnership: jest.fn(),
  getTimetableBlocks: jest.fn(),
  getUserSettings: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("lucide-react", () => ({
  LucideGrid2X2Plus: () => <svg data-testid="grid-icon" />,
  PlusCircle: () => <svg data-testid="plus-icon" />,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <button className={className}>{children}</button>,
}));

jest.mock("@/app/ui/timetable/newtimetable", () => ({
  TimetableGrid: jest.fn(
    ({ events, settings }: { events: unknown; settings: unknown }) => (
      <div data-testid="timetable-grid">
        {JSON.stringify({ events, settings })}
      </div>
    ),
  ),
}));

jest.mock("@/app/ui/timetable/timetablesetselect", () => ({
  __esModule: true,
  default: jest.fn(
    ({
      timetableSets,
      selectedSetId,
    }: {
      timetableSets: unknown;
      selectedSetId: unknown;
    }) => (
      <div data-testid="timetable-set-select">
        {JSON.stringify({ timetableSets, selectedSetId })}
      </div>
    ),
  ),
}));

import TimetablePage from "@/app/dashboard/timetable/page";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAllTimetableSets,
  checkTimetableSetOwnership,
  getTimetableBlocks,
  getUserSettings,
} from "@/lib/data";
import { TimetableGrid } from "@/app/ui/timetable/newtimetable";
import TimetableSetSelect from "@/app/ui/timetable/timetablesetselect";

const mockedGetSession = auth.api.getSession as any as jest.Mock;
const mockedRedirect = redirect as any as jest.Mock;
const mockedGetAllTimetableSets = getAllTimetableSets as jest.Mock;
const mockedCheckTimetableSetOwnership =
  checkTimetableSetOwnership as jest.Mock;
const mockedGetTimetableBlocks = getTimetableBlocks as jest.Mock;
const mockedGetUserSettings = getUserSettings as jest.Mock;
const mockedTimetableGrid = TimetableGrid as jest.Mock;
const mockedTimetableSetSelect = TimetableSetSelect as jest.Mock;

function mockSession(userId: string) {
  mockedGetSession.mockResolvedValue({ user: { id: userId } });
}

describe("TimetablePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedGetUserSettings.mockResolvedValue(null);
    mockedGetAllTimetableSets.mockResolvedValue([]);
    mockedCheckTimetableSetOwnership.mockResolvedValue(false);
    mockedGetTimetableBlocks.mockResolvedValue([]);
  });

  it("redirects to login when there is no session", async () => {
    mockedGetSession.mockResolvedValue(null);
    await expect(TimetablePage({ searchParams: {} })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when the session has no user", async () => {
    mockedGetSession.mockResolvedValue({});
    await expect(TimetablePage({ searchParams: {} })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when the session user has no id", async () => {
    mockSession("");
    await expect(TimetablePage({ searchParams: {} })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders the timetable heading", async () => {
    mockSession("user-1");
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(
      screen.getByRole("heading", { name: /timetable/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty state when the user has no timetable sets", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(
      screen.getByText("You haven't created a timetable yet"),
    ).toBeInTheDocument();
    expect(screen.getByText("Create New Timetable")).toBeInTheDocument();
    expect(screen.queryByText("Add Timetable Block")).not.toBeInTheDocument();
    expect(screen.queryByTestId("timetable-grid")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("timetable-set-select"),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when getAllTimetableSets resolves to null", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue(null);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(
      screen.getByText("You haven't created a timetable yet"),
    ).toBeInTheDocument();
  });

  it("does not render the set selector with a single timetable set", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(
      screen.queryByTestId("timetable-set-select"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Create New Timetable")).toBeInTheDocument();
    expect(screen.getByText("Add Timetable Block")).toBeInTheDocument();
  });

  it("renders the set selector with multiple timetable sets", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
      { id: "set-2", title: "Set 2" },
    ]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(screen.getByTestId("timetable-set-select")).toBeInTheDocument();
    expect(mockedTimetableSetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        timetableSets: [
          { id: "set-1", title: "Set 1" },
          { id: "set-2", title: "Set 2" },
        ],
        selectedSetId: "set-1",
      }),
      undefined,
    );
  });

  it("prefers the set query param over settings and the set list default", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    mockedGetUserSettings.mockResolvedValue({
      last_timetable_set_id: "set-2",
    });
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    const result = await TimetablePage({
      searchParams: { set: "set-query" },
    });
    render(result);
    expect(mockedCheckTimetableSetOwnership).toHaveBeenCalledWith(
      "set-query",
      "user-1",
    );
  });

  it("falls back to the user's last selected set when no query param is present", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    mockedGetUserSettings.mockResolvedValue({
      last_timetable_set_id: "set-2",
    });
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedCheckTimetableSetOwnership).toHaveBeenCalledWith(
      "set-2",
      "user-1",
    );
  });

  it("falls back to the first timetable set when no query param or settings exist", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedCheckTimetableSetOwnership).toHaveBeenCalledWith(
      "set-1",
      "user-1",
    );
  });

  it("does not check ownership or load blocks when no set id can be resolved", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedCheckTimetableSetOwnership).not.toHaveBeenCalled();
    expect(mockedGetTimetableBlocks).not.toHaveBeenCalled();
  });

  it("loads timetable blocks when the user owns the selected set", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    mockedGetTimetableBlocks.mockResolvedValue([{ id: "block-1" }]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedGetTimetableBlocks).toHaveBeenCalledWith("set-1");
    expect(mockedTimetableGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        events: [{ id: "block-1" }],
        settings: null,
      }),
      undefined,
    );
  });

  it("warns and renders no events when the user does not own the selected set", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    mockedCheckTimetableSetOwnership.mockResolvedValue(false);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedGetTimetableBlocks).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "tried to show timetable set set-1 but does not own it",
      ),
    );
    expect(mockedTimetableGrid).toHaveBeenCalledWith(
      expect.objectContaining({ events: [] }),
      undefined,
    );
  });

  it("passes the resolved user settings through to the timetable grid", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    mockedGetUserSettings.mockResolvedValue({
      last_timetable_set_id: "set-1",
    });
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedTimetableGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: { last_timetable_set_id: "set-1" },
      }),
      undefined,
    );
  });

  it("builds the add block link using the selected set id", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1" },
    ]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(
      screen.getByText("Add Timetable Block").closest("a"),
    ).toHaveAttribute("href", "/dashboard/timetable/add-block?setId=set-1");
  });
});
