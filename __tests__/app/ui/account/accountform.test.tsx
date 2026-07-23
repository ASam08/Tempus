import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
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
  },
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

const mockUpdateUser = authClient.updateUser as unknown as jest.Mock;
const mockChangePassword = authClient.changePassword as unknown as jest.Mock;

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

async function switchToPasswordTab(user = userEvent.setup()) {
  await user.click(screen.getByRole("tab", { name: "Password" }));
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

describe("AccountForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as unknown as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockChangePassword.mockResolvedValue({ error: null });
  });

  describe("rendering", () => {
    it("renders the details tab by default with the user's values", () => {
      renderForm();
      expect(nameInput().value).toBe("Jane Doe");
      expect(emailInput().value).toBe("jane@example.com");
    });

    it("renders the email field as disabled", () => {
      renderForm();
      expect(emailInput()).toBeDisabled();
    });

    it("switches to the password tab and renders empty password fields", async () => {
      renderForm();
      await switchToPasswordTab();
      expect(currentPasswordInput()).toBeInTheDocument();
      expect(newPasswordInput()).toBeInTheDocument();
      expect(confirmPasswordInput()).toBeInTheDocument();
      expect(
        screen.getByLabelText("Sign out of all other devices?"),
      ).toBeChecked();
    });
  });

  describe("details form", () => {
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
      expect(toast.success).toHaveBeenCalledWith("Details updated.", {
        position: "top-center",
        style: { backgroundColor: "forestgreen" },
      });
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
        expect(toast.error).toHaveBeenCalledWith("Failed to update details.", {
          position: "top-center",
          style: { backgroundColor: "red" },
        }),
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

  describe("password form", () => {
    it("shows a validation error when the passwords do not match", async () => {
      const user = userEvent.setup();
      renderForm();
      await switchToPasswordTab(user);

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
      await switchToPasswordTab(user);

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
      await switchToPasswordTab(user);

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
      await switchToPasswordTab(user);

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
      await switchToPasswordTab(user);

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
      await switchToPasswordTab(user);

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
