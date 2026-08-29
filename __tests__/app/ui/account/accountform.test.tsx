import "@testing-library/jest-dom";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User } from "better-auth";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    updateUser: jest.fn(),
    changePassword: jest.fn(),
    changeEmail: jest.fn(),
  },
}));

jest.mock("@/lib/data", () => ({
  verifyUserPassword: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/general/password-requirements-hover", () => ({
  PasswordRequirementsHover: () => null,
}));

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock(
  "@/components/ui/checkbox",
  () => require("@/testing/mocks/shadcn").checkboxMock,
);

jest.mock("@/components/ui/dialog", () =>
  require("@/testing/mocks/shadcn").dialogMock(),
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
  "@/components/ui/separator",
  () => require("@/testing/mocks/shadcn").separatorMock,
);

jest.mock(
  "@/components/ui/tabs",
  () => require("@/testing/mocks/shadcn").tabsMock,
);

import AccountForm from "@/app/ui/account/accountform";
import { authClient } from "@/lib/auth-client";
import { verifyUserPassword } from "@/lib/data";

const mockUpdateUser = authClient.updateUser as unknown as jest.Mock;
const mockChangePassword = authClient.changePassword as unknown as jest.Mock;
const mockChangeEmail = authClient.changeEmail as unknown as jest.Mock;
const mockVerifyUserPassword = verifyUserPassword as unknown as jest.Mock;

const baseUser = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
} as unknown as User;

function renderForm(user: User = baseUser) {
  return render(<AccountForm user={user} />);
}

function nameInput() {
  return document.getElementById("name") as HTMLInputElement;
}

function emailInput() {
  return document.getElementById("email") as HTMLInputElement;
}

function verifyPasswordInput() {
  return document.getElementById("verify-password") as HTMLInputElement;
}

function currentPasswordInput() {
  return document.getElementById("current-password") as HTMLInputElement;
}

function newPasswordInput() {
  return document.getElementById("new-password") as HTMLInputElement;
}

function confirmPasswordInput() {
  return document.getElementById("confirm-password") as HTMLInputElement;
}

function saveButton() {
  return screen.getByRole("button", { name: "Save Changes" });
}

function destructiveErrorText() {
  return document.querySelector("p.text-destructive")?.textContent ?? "";
}

function dialog() {
  return screen.queryByRole("dialog");
}

async function switchToTab(
  user: ReturnType<typeof userEvent.setup>,
  name: "Personal" | "Email" | "Password",
) {
  await user.click(screen.getByRole("tab", { name }));
}

async function openVerifyPasswordDialog(
  user: ReturnType<typeof userEvent.setup>,
  newEmail = "new@example.com",
) {
  await switchToTab(user, "Email");
  await user.clear(emailInput());
  await user.type(emailInput(), newEmail);
  await user.click(saveButton());
}

describe("AccountForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as unknown as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockChangePassword.mockResolvedValue({ error: null });
    mockChangeEmail.mockResolvedValue({ error: null });
    mockVerifyUserPassword.mockResolvedValue(true);
  });

  describe("rendering", () => {
    it("renders the personal tab by default with the user's name", () => {
      renderForm();
      expect(nameInput().value).toBe("Jane Doe");
    });

    it("switches to the email tab and renders the user's email as editable", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Email");

      expect(emailInput().value).toBe("jane@example.com");
      expect(emailInput()).not.toBeDisabled();
    });

    it("switches to the password tab and renders empty password fields", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Password");

      expect(currentPasswordInput()).toBeInTheDocument();
      expect(newPasswordInput()).toBeInTheDocument();
      expect(confirmPasswordInput()).toBeInTheDocument();
      expect(
        screen.getByLabelText("Sign out of all other devices?"),
      ).toBeChecked();
    });
  });

  describe("personal form", () => {
    it("shows a validation error when the name is cleared", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.clear(nameInput());
      await user.click(saveButton());

      expect(
        await screen.findByText("Name cannot be empty"),
      ).toBeInTheDocument();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("does not call updateUser when the name is unchanged", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(saveButton());

      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("updates the name, shows a success toast, resets the form, and refreshes the route", async () => {
      const resetSpy = jest.spyOn(HTMLFormElement.prototype, "reset");
      const user = userEvent.setup();
      renderForm();

      await user.clear(nameInput());
      await user.type(nameInput(), "New Name");
      await user.click(saveButton());

      await waitFor(() =>
        expect(mockUpdateUser).toHaveBeenCalledWith({ name: "New Name" }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Personal information updated.",
        { position: "top-center", style: { backgroundColor: "forestgreen" } },
      );
      await waitFor(() => expect(resetSpy).toHaveBeenCalled());
      expect(mockRefresh).toHaveBeenCalled();

      resetSpy.mockRestore();
    });

    it("shows the server error message when updateUser fails", async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: "Name already taken." },
      });
      const user = userEvent.setup();
      renderForm();

      await user.clear(nameInput());
      await user.type(nameInput(), "New Name");
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Name already taken.", {
          position: "top-center",
          style: { backgroundColor: "red" },
        }),
      );
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("falls back to a default error message when updateUser fails without one", async () => {
      mockUpdateUser.mockResolvedValue({ error: {} });
      const user = userEvent.setup();
      renderForm();

      await user.clear(nameInput());
      await user.type(nameInput(), "New Name");
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to update personal information.",
          { position: "top-center", style: { backgroundColor: "red" } },
        ),
      );
    });

    it("disables the save button while the update is pending", async () => {
      let resolveUpdate: (value: { error: null }) => void;
      mockUpdateUser.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );
      const user = userEvent.setup();
      renderForm();

      await user.clear(nameInput());
      await user.type(nameInput(), "New Name");
      await user.click(saveButton());

      await waitFor(() => expect(saveButton()).toBeDisabled());

      await act(async () => {
        resolveUpdate({ error: null });
      });

      await waitFor(() => expect(saveButton()).not.toBeDisabled());
    });
  });

  describe("email form", () => {
    it("shows a validation error for a blank email and does not open the dialog", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Email");

      await user.clear(emailInput());
      await user.click(saveButton());

      expect(
        await screen.findByText("Invalid email address"),
      ).toBeInTheDocument();
      expect(dialog()).not.toBeInTheDocument();
    });

    it("does not open the dialog when the email is unchanged", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Email");

      await user.click(saveButton());

      expect(dialog()).not.toBeInTheDocument();
      expect(mockChangeEmail).not.toHaveBeenCalled();
    });

    it("opens the verify password dialog when the email changes", async () => {
      const user = userEvent.setup();
      renderForm();

      await openVerifyPasswordDialog(user);

      expect(dialog()).toBeInTheDocument();
      expect(
        within(dialog()!).getByText("Verify Password"),
      ).toBeInTheDocument();
    });

    it("shows an error and keeps the dialog open when the password is incorrect", async () => {
      mockVerifyUserPassword.mockResolvedValue(false);
      const user = userEvent.setup();
      renderForm();
      await openVerifyPasswordDialog(user);

      await user.type(verifyPasswordInput(), "WrongPass1!");
      await user.click(
        within(dialog()!).getByRole("button", { name: "Verify" }),
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Password Verification Failed",
          { position: "top-center", style: { backgroundColor: "red" } },
        ),
      );
      expect(mockChangeEmail).not.toHaveBeenCalled();
      expect(dialog()).toBeInTheDocument();
    });

    it("verifies the password, updates the email, closes the dialog, and refreshes the route", async () => {
      const resetSpy = jest.spyOn(HTMLFormElement.prototype, "reset");
      const user = userEvent.setup();
      renderForm();
      await openVerifyPasswordDialog(user, "new@example.com");

      await user.type(verifyPasswordInput(), "CorrectPass1!");
      await user.click(
        within(dialog()!).getByRole("button", { name: "Verify" }),
      );

      await waitFor(() =>
        expect(mockVerifyUserPassword).toHaveBeenCalledWith("CorrectPass1!"),
      );
      await waitFor(() =>
        expect(mockChangeEmail).toHaveBeenCalledWith({
          newEmail: "new@example.com",
          callbackURL: "/dashboard",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Email updated.", {
        position: "top-center",
        style: { backgroundColor: "forestgreen" },
      });
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(resetSpy).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();

      resetSpy.mockRestore();
    });

    it("shows the server error message when changeEmail fails after verification", async () => {
      mockChangeEmail.mockResolvedValue({
        error: { message: "Email already in use." },
      });
      const user = userEvent.setup();
      renderForm();
      await openVerifyPasswordDialog(user);

      await user.type(verifyPasswordInput(), "CorrectPass1!");
      await user.click(
        within(dialog()!).getByRole("button", { name: "Verify" }),
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Email already in use.", {
          position: "top-center",
          style: { backgroundColor: "red" },
        }),
      );
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("falls back to a default error message when changeEmail fails without one", async () => {
      mockChangeEmail.mockResolvedValue({ error: {} });
      const user = userEvent.setup();
      renderForm();
      await openVerifyPasswordDialog(user);

      await user.type(verifyPasswordInput(), "CorrectPass1!");
      await user.click(
        within(dialog()!).getByRole("button", { name: "Verify" }),
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Failed to update email.", {
          position: "top-center",
          style: { backgroundColor: "red" },
        }),
      );
    });

    it("cancels the dialog and clears the pending email", async () => {
      const user = userEvent.setup();
      renderForm();
      await openVerifyPasswordDialog(user);

      await user.click(
        within(dialog()!).getByRole("button", { name: "Cancel" }),
      );

      expect(dialog()).not.toBeInTheDocument();
    });

    it("disables the verify button while verification is pending", async () => {
      let resolveVerify: (value: boolean) => void;
      mockVerifyUserPassword.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveVerify = resolve;
          }),
      );
      const user = userEvent.setup();
      renderForm();
      await openVerifyPasswordDialog(user);

      await user.type(verifyPasswordInput(), "CorrectPass1!");
      await user.click(
        within(dialog()!).getByRole("button", { name: "Verify" }),
      );

      await waitFor(() =>
        expect(
          within(dialog()!).getByRole("button", { name: "Verify" }),
        ).toBeDisabled(),
      );

      await act(async () => {
        resolveVerify(true);
      });

      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    });
  });

  describe("password form", () => {
    it("shows a validation error when the passwords do not match", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Password");

      await user.type(currentPasswordInput(), "OldPass1!");
      await user.type(newPasswordInput(), "NewPass1!");
      await user.type(confirmPasswordInput(), "Different1!");
      await user.click(saveButton());

      expect(destructiveErrorText()).toContain("Passwords do not match");
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it("shows validation errors for a weak password", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Password");

      await user.type(currentPasswordInput(), "OldPass1!");
      await user.type(newPasswordInput(), "abc");
      await user.type(confirmPasswordInput(), "abc");
      await user.click(saveButton());

      const errorText = destructiveErrorText();
      expect(errorText).toContain("New password must:");
      expect(errorText).toContain("Be at least 8 characters long.");
      expect(errorText).toContain("Contain at least one number.");
      expect(errorText).toContain("Contain at least one special character.");
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it("changes the password, shows a success toast, and resets the form", async () => {
      const resetSpy = jest.spyOn(HTMLFormElement.prototype, "reset");
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Password");

      await user.type(currentPasswordInput(), "OldPass1!");
      await user.type(newPasswordInput(), "NewPass1!");
      await user.type(confirmPasswordInput(), "NewPass1!");
      await user.click(saveButton());

      await waitFor(() =>
        expect(mockChangePassword).toHaveBeenCalledWith({
          newPassword: "NewPass1!",
          currentPassword: "OldPass1!",
          revokeOtherSessions: true,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Password updated.", {
        position: "top-center",
        style: { backgroundColor: "forestgreen" },
      });
      await waitFor(() => expect(resetSpy).toHaveBeenCalled());
      expect(mockRefresh).not.toHaveBeenCalled();

      resetSpy.mockRestore();
    });

    it("shows the server error message when changePassword fails", async () => {
      mockChangePassword.mockResolvedValue({
        error: { message: "Current password is incorrect." },
      });
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Password");

      await user.type(currentPasswordInput(), "WrongPass1!");
      await user.type(newPasswordInput(), "NewPass1!");
      await user.type(confirmPasswordInput(), "NewPass1!");
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Current password is incorrect.",
          { position: "top-center", style: { backgroundColor: "red" } },
        ),
      );
    });

    it("falls back to a default error message when changePassword fails without one", async () => {
      mockChangePassword.mockResolvedValue({ error: {} });
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Password");

      await user.type(currentPasswordInput(), "OldPass1!");
      await user.type(newPasswordInput(), "NewPass1!");
      await user.type(confirmPasswordInput(), "NewPass1!");
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Failed to update password.", {
          position: "top-center",
          style: { backgroundColor: "red" },
        }),
      );
    });

    it("sends revokeSessions as false when the checkbox is unchecked", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToTab(user, "Password");

      await user.click(screen.getByLabelText("Sign out of all other devices?"));
      await user.type(currentPasswordInput(), "OldPass1!");
      await user.type(newPasswordInput(), "NewPass1!");
      await user.type(confirmPasswordInput(), "NewPass1!");
      await user.click(saveButton());

      await waitFor(() =>
        expect(mockChangePassword).toHaveBeenCalledWith(
          expect.objectContaining({ revokeOtherSessions: false }),
        ),
      );
    });
  });
});
