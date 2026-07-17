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
    ({
      events,
      settings,
      setId,
    }: {
      events: unknown;
      settings: unknown;
      setId: unknown;
    }) => (
      <div data-testid="timetable-grid">
        {JSON.stringify({ events, settings, setId })}
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
  getTimetableBlocks,
  getUserSettings,
} from "@/lib/data";
import { TimetableGrid } from "@/app/ui/timetable/newtimetable";
import TimetableSetSelect from "@/app/ui/timetable/timetablesetselect";

const mockedGetSession = auth.api.getSession as any as jest.Mock;
const mockedRedirect = redirect as any as jest.Mock;
const mockedGetAllTimetableSets = getAllTimetableSets as jest.Mock;
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
    mockedRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
    mockedGetUserSettings.mockResolvedValue(null);
    mockedGetAllTimetableSets.mockResolvedValue([]);
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

  it("fetches timetable sets and settings using the resolved user id", async () => {
    mockSession("user-1");
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedGetAllTimetableSets).toHaveBeenCalledWith("user-1");
    expect(mockedGetUserSettings).toHaveBeenCalledWith("user-1");
  });

  it("always renders the timetable set selector, even with no sets", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(screen.getByTestId("timetable-set-select")).toBeInTheDocument();
    expect(mockedTimetableSetSelect).toHaveBeenCalledWith(
      expect.objectContaining({ timetableSets: [], selectedSetId: undefined }),
      undefined,
    );
  });

  it("renders the selector with a null selectedSetId when getAllTimetableSets resolves null", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue(null);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedTimetableSetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        timetableSets: null,
        selectedSetId: undefined,
      }),
      undefined,
    );
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
    expect(screen.queryByTestId("timetable-grid")).not.toBeInTheDocument();
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

  it("links the empty state buttons to the new-timetable page", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(
      screen.getByText("Create New Timetable").closest("a"),
    ).toHaveAttribute("href", "./timetable/new-timetable");
  });

  it("renders the timetable grid and set description when a set is selected", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: "Desc 1" },
    ]);
    mockedGetTimetableBlocks.mockResolvedValue([{ id: "block-1" }]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(screen.getByTestId("timetable-grid")).toBeInTheDocument();
    expect(screen.getByText("Desc 1")).toBeInTheDocument();
    expect(
      screen.queryByText("You haven't created a timetable yet"),
    ).not.toBeInTheDocument();
  });

  it("does not render a description when the selected set has none", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: null },
    ]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(screen.queryByText("Desc 1")).not.toBeInTheDocument();
  });

  it("uses the set query param when it matches an owned set", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: null },
      { id: "set-2", title: "Set 2", description: null },
    ]);
    mockedGetUserSettings.mockResolvedValue({
      last_timetable_set_id: "set-1",
    });
    const result = await TimetablePage({
      searchParams: { set: "set-2" },
    });
    render(result);
    expect(mockedGetTimetableBlocks).toHaveBeenCalledWith("set-2");
  });

  it("falls back to the first set when the query param does not match an owned set", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: null },
      { id: "set-2", title: "Set 2", description: null },
    ]);
    const result = await TimetablePage({
      searchParams: { set: "not-owned" },
    });
    render(result);
    expect(mockedGetTimetableBlocks).toHaveBeenCalledWith("set-1");
  });

  it("falls back to the user's last selected set when no query param is present", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: null },
      { id: "set-2", title: "Set 2", description: null },
    ]);
    mockedGetUserSettings.mockResolvedValue({
      last_timetable_set_id: "set-2",
    });
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedGetTimetableBlocks).toHaveBeenCalledWith("set-2");
  });

  it("falls back to the first timetable set when neither query param nor settings match an owned set", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: null },
      { id: "set-2", title: "Set 2", description: null },
    ]);
    mockedGetUserSettings.mockResolvedValue({
      last_timetable_set_id: "not-owned",
    });
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedGetTimetableBlocks).toHaveBeenCalledWith("set-1");
  });

  it("does not fetch timetable blocks when no set id can be resolved", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedGetTimetableBlocks).not.toHaveBeenCalled();
  });

  it("passes events, settings, and setId through to the timetable grid", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: null },
    ]);
    mockedGetUserSettings.mockResolvedValue({
      last_timetable_set_id: "set-1",
    });
    mockedGetTimetableBlocks.mockResolvedValue([{ id: "block-1" }]);
    const result = await TimetablePage({ searchParams: {} });
    render(result);
    expect(mockedTimetableGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        events: [{ id: "block-1" }],
        settings: { last_timetable_set_id: "set-1" },
        setId: "set-1",
      }),
      undefined,
    );
  });

  it("passes the selected set id through to the timetable set selector", async () => {
    mockSession("user-1");
    mockedGetAllTimetableSets.mockResolvedValue([
      { id: "set-1", title: "Set 1", description: null },
      { id: "set-2", title: "Set 2", description: null },
    ]);
    const result = await TimetablePage({
      searchParams: { set: "set-2" },
    });
    render(result);
    expect(mockedTimetableSetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        timetableSets: [
          { id: "set-1", title: "Set 1", description: null },
          { id: "set-2", title: "Set 2", description: null },
        ],
        selectedSetId: "set-2",
      }),
      undefined,
    );
  });
});
