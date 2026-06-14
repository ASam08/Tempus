import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/components/ui/login/login-form", () => ({
  __esModule: true,
  LoginForm: ({ emailDisabled }: { emailDisabled: boolean }) => (
    <div data-testid="login-form" data-email-disabled={String(emailDisabled)}>
      Login Form
    </div>
  ),
}));

jest.mock("@/components/branding/tempuslogobrand", () => ({
  __esModule: true,
  default: () => <img alt="Tempus logo" />,
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      EMAIL_DOMAIN: "example.com",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("renders the login form", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders the Tempus logo", () => {
    render(<LoginPage />);
    expect(screen.getByAltText(/tempus logo/i)).toBeInTheDocument();
  });

  it("passes emailDisabled=false when both env vars are set", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toHaveAttribute(
      "data-email-disabled",
      "false",
    );
  });

  it("passes emailDisabled=true when RESEND_API_KEY is missing", () => {
    delete process.env.RESEND_API_KEY;

    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toHaveAttribute(
      "data-email-disabled",
      "true",
    );
  });

  it("passes emailDisabled=true when EMAIL_DOMAIN is missing", () => {
    delete process.env.EMAIL_DOMAIN;

    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toHaveAttribute(
      "data-email-disabled",
      "true",
    );
  });

  it("passes emailDisabled=true when both env vars are missing", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_DOMAIN;

    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toHaveAttribute(
      "data-email-disabled",
      "true",
    );
  });
});
