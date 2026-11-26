import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import ResetPasswordForm from "@/components/ui/reset-password/reset-password-form";

const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
  useSearchParams: jest.fn(() => ({ get: mockGet })),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    resetPassword: jest.fn(),
  },
}));

jest.mock(
  "@/components/ui/toast",
  () => require("@/testing/mocks/shadcn").toastMock,
);

jest.mock("@/lib/schema", () => ({
  passwordSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock("@/components/general/password-requirements-hover", () => ({
  __esModule: true,
  PasswordRequirementsHover: () => <span>Password requirements</span>,
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

import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";
import { passwordSchema } from "@/lib/schema";

function submitForm(newPassword: string, confirmPassword: string) {
  fireEvent.change(screen.getByLabelText(/new password/i), {
    target: { value: newPassword },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: confirmPassword },
  });
  fireEvent.submit(document.querySelector("form")!);
}

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue("valid-token");
    (passwordSchema.safeParse as jest.Mock).mockReturnValue({ success: true });
  });

  describe("rendering", () => {
    it("renders the heading and form fields", () => {
      render(<ResetPasswordForm />);
      expect(
        screen.getByRole("heading", { name: /set new password/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /set new password/i }),
      ).toBeInTheDocument();
    });

    it("renders the password requirements hover component", () => {
      render(<ResetPasswordForm />);
      expect(screen.getByText("Password requirements")).toBeInTheDocument();
    });

    it("submit button is enabled by default", () => {
      render(<ResetPasswordForm />);
      expect(
        screen.getByRole("button", { name: /set new password/i }),
      ).not.toBeDisabled();
    });
  });

  describe("schema validation failure", () => {
    it("shows toast error listing each schema issue when password fails validation", () => {
      (passwordSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {
          issues: [
            { message: "at least 8 characters" },
            { message: "at least one uppercase letter" },
          ],
        },
      });

      render(<ResetPasswordForm />);
      submitForm("bad", "bad");

      expect(toast.add).toHaveBeenCalledTimes(1);
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Password must:", type: "error" }),
      );

      const { description } = (toast.add as jest.Mock).mock.calls[0][0];
      render(description);

      expect(
        screen.getAllByRole("listitem").map((item) => item.textContent),
      ).toEqual(["at least 8 characters", "at least one uppercase letter"]);
      expect(authClient.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe("password mismatch", () => {
    it("shows toast error when passwords do not match", () => {
      render(<ResetPasswordForm />);
      submitForm("ValidPass1!", "DifferentPass1!");

      expect(toast.add).toHaveBeenCalledWith({
        title: "Passwords do not match.",
        type: "error",
      });
      expect(authClient.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe("missing token", () => {
    it("shows toast error and does not call resetPassword when token is missing", async () => {
      mockGet.mockReturnValue(null);

      render(<ResetPasswordForm />);
      submitForm("ValidPass1!", "ValidPass1!");

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith({
          title: "Invalid password reset link!",
          description: "The password reset link is missing a token.",
          timeout: 5000,
          type: "error",
        });
      });
      expect(authClient.resetPassword).not.toHaveBeenCalled();
    });

    it("re-enables the submit button after the missing token error", async () => {
      mockGet.mockReturnValue(null);

      render(<ResetPasswordForm />);
      submitForm("ValidPass1!", "ValidPass1!");

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalled();
      });
      expect(
        screen.getByRole("button", { name: /set new password/i }),
      ).not.toBeDisabled();
    });
  });

  describe("successful reset", () => {
    it("calls resetPassword with the password and token, shows success toast, and redirects", async () => {
      (authClient.resetPassword as any as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      render(<ResetPasswordForm />);
      submitForm("ValidPass1!", "ValidPass1!");

      await waitFor(() => {
        expect(authClient.resetPassword).toHaveBeenCalledWith({
          newPassword: "ValidPass1!",
          token: "valid-token",
        });
      });

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith({
          title: "Password reset successful!",
          type: "success",
          timeout: 5000,
          description: "Your password has been reset. You can now log in.",
        });
      });

      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  describe("failed reset", () => {
    it("shows error toast and does not redirect when resetPassword returns an error", async () => {
      (authClient.resetPassword as any as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: "Token expired" },
      });

      render(<ResetPasswordForm />);
      submitForm("ValidPass1!", "ValidPass1!");

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith({
          title: "Failed to reset password",
          type: "error",
          timeout: 5000,
          description:
            "The reset link may have expired. Please request a new one.",
        });
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("pending state", () => {
    it("disables button and shows pending label while reset is in progress", async () => {
      let resolveReset!: (value: unknown) => void;
      (authClient.resetPassword as any as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveReset = resolve;
        }),
      );

      render(<ResetPasswordForm />);
      submitForm("ValidPass1!", "ValidPass1!");

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /setting new password/i }),
        ).toBeDisabled();
      });

      resolveReset({ data: {}, error: null });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /set new password/i }),
        ).not.toBeDisabled();
      });
    });
  });
});
