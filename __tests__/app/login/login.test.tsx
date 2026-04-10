import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/components/ui/login/login-form", () => ({
  __esModule: true,
  LoginForm: () => <div>Login Form</div>,
}));

jest.mock("@/components/branding/tempuslogobrand", () => ({
  __esModule: true,
  default: () => <img alt="Tempus logo" />,
}));

jest.mock("@/lib/actions", () => ({
  authenticate: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  DATABASE_URL: "postgres://dummy:dummy@dummy:5432/dummy",
  sqlConn: {},
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to dashboard when auth is off", () => {
    const { redirect } = require("next/navigation");
    process.env.AUTH_ON = "false";
    render(<LoginPage />);
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does not redirect when auth is on", () => {
    const { redirect } = require("next/navigation");
    process.env.AUTH_ON = "true";
    render(<LoginPage />);
    expect(redirect).not.toHaveBeenCalled();
  });
});
