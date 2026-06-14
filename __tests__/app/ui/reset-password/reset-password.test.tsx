import { render, screen } from "@testing-library/react";
import * as React from "react";

const mockRedirect = jest.fn(() => {
  throw new Error("redirect");
});

jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
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

jest.mock("@/components/branding/tempuslogobrand", () => ({
  __esModule: true,
  default: ({ width, height }: { width: number; height: number }) => (
    <img src="/logo.png" alt="Tempus" width={width} height={height} />
  ),
}));

jest.mock("@/components/ui/reset-password/reset-password-form", () => ({
  __esModule: true,
  default: () => <div>Reset Password Form</div>,
}));

describe("ResetPasswordPage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirect.mockImplementation(() => {
      throw new Error("redirect");
    });
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("when env vars are set", () => {
    it("renders the logo link, and the reset password form", async () => {
      process.env.EMAIL_DOMAIN = "example.com";
      process.env.RESEND_API_KEY = "re_test_key";

      jest.resetModules();
      const { default: PasswordResetPage } =
        await import("@/app/reset-password/page");

      render(<PasswordResetPage />);

      expect(screen.getByRole("link", { name: /tempus/i })).toHaveAttribute(
        "href",
        "/",
      );
      expect(screen.getByText("Reset Password Form")).toBeInTheDocument();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("when env vars are missing", () => {
    it("redirects to /login when EMAIL_DOMAIN is undefined", async () => {
      delete process.env.EMAIL_DOMAIN;
      process.env.RESEND_API_KEY = "re_test_key";

      jest.resetModules();
      const { default: PasswordResetPage } =
        await import("@/app/reset-password/page");

      expect(() => render(<PasswordResetPage />)).toThrow("redirect");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects to /login when RESEND_API_KEY is undefined", async () => {
      process.env.EMAIL_DOMAIN = "example.com";
      delete process.env.RESEND_API_KEY;

      jest.resetModules();
      const { default: PasswordResetPage } =
        await import("@/app/reset-password/page");

      expect(() => render(<PasswordResetPage />)).toThrow("redirect");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects to /login when both env vars are undefined", async () => {
      delete process.env.EMAIL_DOMAIN;
      delete process.env.RESEND_API_KEY;

      jest.resetModules();
      const { default: PasswordResetPage } =
        await import("@/app/reset-password/page");

      expect(() => render(<PasswordResetPage />)).toThrow("redirect");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });
});
