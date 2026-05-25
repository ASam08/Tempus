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

const mockedAuth = require("@/lib/auth").auth.api.getSession;

import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Dashboard heading", async () => {
    const result = await DashboardPage();
    render(result);
    expect(
      screen.getByRole("heading", { name: /dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders user name in greeting when session has a name", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { name: "Test User", role: "user" },
    });
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
  });

  it("renders generic greeting when session has no user name", async () => {
    mockedAuth.mockResolvedValueOnce({ user: { name: null, role: "user" } });
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });

  it("renders generic greeting when session is null", async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText(/here's what's next/i)).toBeInTheDocument();
  });

  it("renders all dashboard cards", async () => {
    const result = await DashboardPage();
    render(result);
    expect(screen.getByText("CurrentCardClient")).toBeInTheDocument();
    expect(screen.getByText("NextBreakCardClient")).toBeInTheDocument();
    expect(screen.getByText("NextCardClient")).toBeInTheDocument();
  });

  it("renders the Admin button when user is admin", async () => {
    mockedAuth.mockResolvedValueOnce({
      user: { name: "Admin User", role: "admin" },
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
      user: { name: "Regular User", role: "user" },
    });
    const result = await DashboardPage();
    render(result);
    expect(
      screen.queryByRole("link", { name: /admin/i }),
    ).not.toBeInTheDocument();
  });
});
