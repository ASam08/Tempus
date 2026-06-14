import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import PasswordResetForm from "@/components/ui/login/password-reset/password-reset-form";

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: Object.assign(jest.fn(), {
    error: jest.fn(),
    success: jest.fn(),
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("lucide-react", () => ({
  LucideCircleQuestionMark: () => <span>?</span>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/ui/field", () => ({
  Field: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FieldLabel: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HoverCardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

function submitForm(email: string) {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: email },
  });
  fireEvent.submit(document.querySelector("form")!);
}

describe("PasswordResetForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the heading, email field, submit button, and back to login link", () => {
      render(<PasswordResetForm />);

      expect(
        screen.getByRole("heading", { name: /password reset/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reset password/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /back to login/i }),
      ).toHaveAttribute("href", "/login");
    });

    it("does not show the submitted message initially", () => {
      render(<PasswordResetForm />);

      expect(
        screen.queryByText(/if an account with that email exists/i),
      ).not.toBeInTheDocument();
    });

    it("submit button is enabled by default", () => {
      render(<PasswordResetForm />);

      expect(
        screen.getByRole("button", { name: /reset password/i }),
      ).not.toBeDisabled();
    });

    it("renders the HoverCard and Popover help content", () => {
      render(<PasswordResetForm />);

      const helpTexts = screen.getAllByText(
        /enter your email address and we'll send you a link/i,
      );
      expect(helpTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("successful submission", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("calls requestPasswordReset with the email and redirectTo, shows success toast, and renders submitted message", async () => {
      (authClient.requestPasswordReset as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
          email: "user@example.com",
          redirectTo: expect.stringContaining("/reset-password"),
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Password reset requested!",
          expect.objectContaining({ position: "top-center" }),
        );
      });

      expect(
        screen.getByText(/if an account with that email exists/i),
      ).toBeInTheDocument();
    });

    it("uses NEXT_PUBLIC_TEMPUS_URL env var in the redirectTo URL when set", async () => {
      process.env.NEXT_PUBLIC_TEMPUS_URL = "https://mytempus.example.com";

      (authClient.requestPasswordReset as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
          email: "user@example.com",
          redirectTo: "https://mytempus.example.com/reset-password",
        });
      });
    });

    it("falls back to http://localhost:3000 in redirectTo when NEXT_PUBLIC_TEMPUS_URL is not set", async () => {
      delete process.env.NEXT_PUBLIC_TEMPUS_URL;

      (authClient.requestPasswordReset as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
          email: "user@example.com",
          redirectTo: "http://localhost:3000/reset-password",
        });
      });
    });
  });

  describe("failed submission", () => {
    it("shows error toast and does not render submitted message when an error is returned", async () => {
      (authClient.requestPasswordReset as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: "Server error" },
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Password reset error!",
          expect.objectContaining({ position: "top-center" }),
        );
      });

      expect(
        screen.queryByText(/if an account with that email exists/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("pending state", () => {
    it("disables the button and shows sending label while the request is in flight", async () => {
      let resolveReset!: (value: unknown) => void;
      (authClient.requestPasswordReset as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveReset = resolve;
        }),
      );

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
      });

      resolveReset({ data: {}, error: null });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /reset password/i }),
        ).not.toBeDisabled();
      });
    });
  });

  describe("submitted state", () => {
    it("can submit again after a successful submission", async () => {
      (authClient.requestPasswordReset as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(
          screen.getByText(/if an account with that email exists/i),
        ).toBeInTheDocument();
      });

      submitForm("other@example.com");

      await waitFor(() => {
        expect(authClient.requestPasswordReset).toHaveBeenCalledTimes(2);
      });
    });
  });
});
