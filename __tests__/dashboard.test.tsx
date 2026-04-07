import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";

jest.mock("@/auth", () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock("@/lib/actions", () => ({
  authenticate: jest.fn(),
}));

jest.mock("@/app/ui/dashboard/currentcardclient", () => ({
  __esModule: true,
  CurrentCardClient: () => <div>CurrentCardClient</div>,
}));

jest.mock("@/app/ui/dashboard/nextcardclient", () => ({
  __esModule: true,
  NextCardClient: () => <div>NextCardClient</div>,
}));

jest.mock("@/app/ui/dashboard/nextbreakcardclient", () => ({
  __esModule: true,
  NextBreakCardClient: () => <div>NextBreakCardClient</div>,
}));

jest.mock("@/components/ui/dashboard/localdate", () => ({
  __esModule: true,
  LocalDateDisplay: () => <div>LocalDateDisplay</div>,
}));

jest.mock("@/components/ui/dashboard/localtime", () => ({
  __esModule: true,
  LocalTimeDisplay: () => <div>LocalTimeDisplay</div>,
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
  SideNav: () => <div>SideNav</div>,
}));

jest.mock("@/app/ui/darkmode", () => ({
  __esModule: true,
  ModeToggle: () => <div>DarkModeToggle</div>,
}));

const mockedAuth = require("@/auth").auth;

import DashboardPage from "../app/dashboard/page";

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the dashboard page with user name", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: "Test User" } });

    await act(async () => {
      render(<DashboardPage />);
    });

    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it("renders 'Here's' without a name when session has no user name", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: null } });

    await act(async () => {
      render(<DashboardPage />);
    });

    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
    expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument();
  });

  it("renders all dashboard cards", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: "Test User" } });

    await act(async () => {
      render(<DashboardPage />);
    });

    expect(screen.getByText("CurrentCardClient")).toBeInTheDocument();
    expect(screen.getByText("NextBreakCardClient")).toBeInTheDocument();
    expect(screen.getByText("NextCardClient")).toBeInTheDocument();
  });
});
