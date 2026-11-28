import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import PasswordResetForm from "@/components/ui/login/password-reset/password-reset-form";

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: jest.fn(),
  },
}));

jest.mock(
  "@/components/ui/toast",
  () => require("@/testing/mocks/shadcn").toastMock,
);

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

jest.mock(
  "@/components/ui/card",
  () => require("@/testing/mocks/shadcn").cardMock,
);

jest.mock(
  "@/components/ui/field",
  () => require("@/testing/mocks/shadcn").fieldMock,
);

jest.mock(
  "@/components/ui/input",
  () => require("@/testing/mocks/shadcn").inputMock,
);

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock(
  "@/components/ui/hover-card",
  () => require("@/testing/mocks/shadcn").hoverCardMock,
);

jest.mock(
  "@/components/ui/popover",
  () => require("@/testing/mocks/shadcn").popoverMock,
);

import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";

const mockRequestPasswordReset = authClient.requestPasswordReset as jest.Mock;

const successDescription =
  "If an account with that email exists, we've sent you a link to reset your password.";
const failureDescription =
  "An error occurred while sending the password reset email. Please try again.";

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
      mockRequestPasswordReset.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith({
          email: "user@example.com",
          redirectTo: expect.stringContaining("/reset-password"),
        });
      });

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith({
          title: "Password reset requested!",
          description: successDescription,
          type: "success",
        });
      });

      expect(
        screen.getByText(/if an account with that email exists/i),
      ).toBeInTheDocument();
    });

    it("uses NEXT_PUBLIC_TEMPUS_URL env var in the redirectTo URL when set", async () => {
      process.env.NEXT_PUBLIC_TEMPUS_URL = "https://mytempus.example.com";

      mockRequestPasswordReset.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith({
          email: "user@example.com",
          redirectTo: "https://mytempus.example.com/reset-password",
        });
      });
    });

    it("falls back to http://localhost:3000 in redirectTo when NEXT_PUBLIC_TEMPUS_URL is not set", async () => {
      delete process.env.NEXT_PUBLIC_TEMPUS_URL;

      mockRequestPasswordReset.mockResolvedValue({
        data: {},
        error: null,
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith({
          email: "user@example.com",
          redirectTo: "http://localhost:3000/reset-password",
        });
      });
    });
  });

  describe("failed submission", () => {
    it("shows the server error message in the toast and does not render the submitted message", async () => {
      mockRequestPasswordReset.mockResolvedValue({
        data: null,
        error: { message: "Server error" },
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith({
          title: "Server error",
          description: failureDescription,
          type: "error",
        });
      });

      expect(toast.add).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText(/if an account with that email exists/i),
      ).not.toBeInTheDocument();
    });

    it("falls back to the default error title when the error has no message", async () => {
      mockRequestPasswordReset.mockResolvedValue({
        data: null,
        error: {},
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith({
          title: "Password reset error!",
          description: failureDescription,
          type: "error",
        });
      });

      expect(
        screen.queryByText(/if an account with that email exists/i),
      ).not.toBeInTheDocument();
    });

    it("shows the default error title when the request throws", async () => {
      mockRequestPasswordReset.mockRejectedValue(new Error("network"));

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Password reset error!",
            type: "error",
          }),
        );
      });

      expect(toast.add).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText(/if an account with that email exists/i),
      ).not.toBeInTheDocument();
    });

    it("re-enables the submit button after a failure", async () => {
      mockRequestPasswordReset.mockResolvedValue({
        data: null,
        error: { message: "Server error" },
      });

      render(<PasswordResetForm />);
      submitForm("user@example.com");

      await waitFor(() => expect(toast.add).toHaveBeenCalled());

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /reset password/i }),
        ).not.toBeDisabled();
      });
    });
  });

  describe("pending state", () => {
    it("disables the button and shows sending label while the request is in flight", async () => {
      let resolveReset!: (value: unknown) => void;
      mockRequestPasswordReset.mockReturnValue(
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
      mockRequestPasswordReset.mockResolvedValue({
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
        expect(mockRequestPasswordReset).toHaveBeenCalledTimes(2);
      });
    });
  });
});
