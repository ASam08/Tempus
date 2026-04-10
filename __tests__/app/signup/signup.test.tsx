import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/components/ui/signup/signup-form", () => ({
  __esModule: true,
  SignupForm: () => <div>SignUp Form</div>,
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

import SignUpPage from "@/app/signup/page";

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to dashboard when auth is off", () => {
    const { redirect } = require("next/navigation");
    process.env.AUTH_ON = "false";
    render(<SignUpPage />);
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does not redirect when auth is on", () => {
    const { redirect } = require("next/navigation");
    process.env.AUTH_ON = "true";
    render(<SignUpPage />);
    expect(redirect).not.toHaveBeenCalled();
  });
});
