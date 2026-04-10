import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@/auth", () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock("@/lib/actions", () => ({
  authenticate: jest.fn(),
}));

jest.mock("@/app/ui/dashboard/currentcardclient", () => ({
  __esModule: true,
  default: () => <div>CurrentCardClient</div>,
}));

jest.mock("@/app/ui/dashboard/nextcardclient", () => ({
  __esModule: true,
  default: () => <div>NextCardClient</div>,
}));

jest.mock("@/app/ui/dashboard/nextbreakcardclient", () => ({
  __esModule: true,
  default: () => <div>NextBreakCardClient</div>,
}));

jest.mock("@/components/ui/dashboard/localdate", () => ({
  __esModule: true,
  default: () => <div>LocalDateDisplay</div>,
}));

jest.mock("@/components/ui/dashboard/localtime", () => ({
  __esModule: true,
  default: () => <div>LocalTimeDisplay</div>,
}));

jest.mock("@/lib/db", () => ({
  DATABASE_URL: "postgres://dummy:dummy@dummy:5432/dummy",
  sqlConn: {},
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/app/ui/dashboard/sidenav", () => ({
  __esModule: true,
  default: () => <div>SideNav</div>,
}));

jest.mock("@/app/ui/darkmode", () => ({
  __esModule: true,
  ModeToggle: () => <div>DarkModeToggle</div>,
}));

const mockedAuth = require("@/auth").auth;

import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Dashboard heading", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: "Test User" } });
    const result = await DashboardPage();
    render(result);
    expect(
      screen.getByRole("heading", { name: /dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders the dashboard page with user name", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: "Test User" } });
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it("renders 'Here's' without a name when session has no user name", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: null } });
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });

  it("handles missing session gracefully", async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
  });

  it("renders all dashboard cards", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: "Test User" } });
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText("CurrentCardClient")).toBeInTheDocument();
    expect(screen.getByText("NextBreakCardClient")).toBeInTheDocument();
    expect(screen.getByText("NextCardClient")).toBeInTheDocument();
  });
});
