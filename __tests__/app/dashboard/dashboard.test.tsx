import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

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

jest.mock("@/lib/data", () => ({
  getAllTimetableSets: jest.fn(),
}));

jest.mock("@/app/ui/dashboard/currentcardclient", () => ({
  __esModule: true,
  default: ({ setId }: { setId: string }) => (
    <div>CurrentCardClient-{setId}</div>
  ),
}));

jest.mock("@/app/ui/dashboard/nextcardclient", () => ({
  __esModule: true,
  default: ({ setId }: { setId: string }) => <div>NextCardClient-{setId}</div>,
}));

jest.mock("@/app/ui/dashboard/nextbreakcardclient", () => ({
  __esModule: true,
  default: ({ setId }: { setId: string }) => (
    <div>NextBreakCardClient-{setId}</div>
  ),
}));

jest.mock("@/components/ui/dashboard/localdate", () => ({
  __esModule: true,
  default: () => <div>LocalDateDisplay</div>,
}));

jest.mock("@/components/ui/dashboard/localtime", () => ({
  __esModule: true,
  default: () => <div>LocalTimeDisplay</div>,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const mockedAuth = require("@/lib/auth").auth.api.getSession;

import DashboardPage from "@/app/dashboard/page";
import { getAllTimetableSets } from "@/lib/data";
import { redirect } from "next/navigation";

const mockGetAllTimetableSets = getAllTimetableSets as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;

describe("DashboardPage", () => {
  beforeEach(() => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-123", name: "Test User", role: "user" },
    });
    mockGetAllTimetableSets.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login when the session has no user id", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: "No ID User" } });
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
    expect(mockGetAllTimetableSets).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    mockedAuth.mockResolvedValueOnce(null);
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders the Dashboard heading and local date/time", async () => {
    const result = await DashboardPage();
    render(result);
    expect(
      screen.getByRole("heading", { name: /dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("LocalDateDisplay")).toBeInTheDocument();
    expect(screen.getByText("LocalTimeDisplay")).toBeInTheDocument();
  });

  it("renders user name in greeting when session has a name", async () => {
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
  });

  it("renders generic greeting when session has no user name", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-123", name: null, role: "user" },
    });
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });

  it("renders a message and no cards when there are no timetable sets", async () => {
    mockGetAllTimetableSets.mockResolvedValueOnce([]);
    const result = await DashboardPage();
    render(result);
    expect(
      screen.getByText("Nothing to see here, add a timetable to get started!"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/CurrentCardClient/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NextCardClient/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NextBreakCardClient/)).not.toBeInTheDocument();
  });

  it("renders a timetable set's title and dashboard cards with the correct setId", async () => {
    mockGetAllTimetableSets.mockResolvedValueOnce([
      { id: "set-1", title: "My Timetable" },
    ]);
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText("My Timetable")).toBeInTheDocument();
    expect(screen.getByText("CurrentCardClient-set-1")).toBeInTheDocument();
    expect(screen.getByText("NextBreakCardClient-set-1")).toBeInTheDocument();
    expect(screen.getByText("NextCardClient-set-1")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Nothing to see here, add a timetable to get started!",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders cards for each timetable set when there are multiple", async () => {
    mockGetAllTimetableSets.mockResolvedValueOnce([
      { id: "set-1", title: "Timetable One" },
      { id: "set-2", title: "Timetable Two" },
    ]);
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText("Timetable One")).toBeInTheDocument();
    expect(screen.getByText("Timetable Two")).toBeInTheDocument();
    expect(screen.getByText("CurrentCardClient-set-1")).toBeInTheDocument();
    expect(screen.getByText("CurrentCardClient-set-2")).toBeInTheDocument();
    expect(screen.getByText("NextBreakCardClient-set-1")).toBeInTheDocument();
    expect(screen.getByText("NextBreakCardClient-set-2")).toBeInTheDocument();
    expect(screen.getByText("NextCardClient-set-1")).toBeInTheDocument();
    expect(screen.getByText("NextCardClient-set-2")).toBeInTheDocument();
  });

  it("renders the Admin button when user is admin", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-123", name: "Admin User", role: "admin" },
    });
    const result = await DashboardPage();
    render(result);
    expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/dashboard/admin",
    );
  });

  it("does not render the Admin button when user is not admin", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { id: "user-123", name: "Regular User", role: "user" },
    });
    const result = await DashboardPage();
    render(result);
    expect(
      screen.queryByRole("link", { name: /admin/i }),
    ).not.toBeInTheDocument();
  });
});
