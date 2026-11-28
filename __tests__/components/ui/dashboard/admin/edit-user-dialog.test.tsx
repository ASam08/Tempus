import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "better-auth";
import { EditUserDialog } from "@/components/ui/dashboard/admin/edit-user-dialog";

const mockRefresh = jest.fn();
const mockListUsers = jest.fn();
const mockUpdateUser = jest.fn();
const mockToastNotifications = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    admin: {
      listUsers: (...args: unknown[]) => mockListUsers(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

jest.mock("@/components/general/auth-toast-notifications", () => ({
  authToastNotifications: (...args: unknown[]) =>
    mockToastNotifications(...args),
}));

const chosenUser = {
  id: "user-1",
  name: "Sam Smith",
  email: "sam@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} as User;

function renderComponent(
  overrides: Partial<{ chosenUser: User; open: boolean }> = {},
) {
  const onOpenChange = jest.fn();
  const props = { chosenUser, open: true, onOpenChange, ...overrides };
  const view = render(<EditUserDialog {...props} />);
  return {
    ...view,
    props,
    onOpenChange,
    user: userEvent.setup(),
  };
}

function getNameInput() {
  return screen.getByLabelText("Name");
}

function getEmailInput() {
  return screen.getByLabelText("Email");
}

function getSaveButton() {
  return screen.getByRole("button", { name: "Save Changes" });
}

function getCancelButton() {
  return screen.getByRole("button", { name: "Cancel" });
}

function getForm() {
  return getSaveButton().closest("form") as HTMLFormElement;
}

describe("EditUserDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    mockToastNotifications.mockImplementation(
      async (action: () => Promise<unknown>) => {
        await action();
        return true;
      },
    );
  });

  describe("rendering", () => {
    it("renders the dialog with the chosen user's details", () => {
      renderComponent();

      expect(
        screen.getByRole("dialog", { name: "Edit User" }),
      ).toBeInTheDocument();
      expect(getNameInput()).toHaveValue("Sam Smith");
      expect(getEmailInput()).toHaveValue("sam@example.com");
      expect(getEmailInput()).toHaveAttribute("type", "email");
    });

    it("does not render the dialog when closed", () => {
      renderComponent({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("disables Save Changes until the form is dirty", async () => {
      const { user } = renderComponent();

      expect(getSaveButton()).toBeDisabled();

      await user.type(getNameInput(), "y");

      expect(getSaveButton()).toBeEnabled();
    });

    it("does not show a root error or field errors initially", () => {
      renderComponent();

      expect(getNameInput()).toHaveAttribute("aria-invalid", "false");
      expect(getEmailInput()).toHaveAttribute("aria-invalid", "false");
      expect(
        screen.queryByText("Couldn't check that email. Please try again."),
      ).not.toBeInTheDocument();
    });

    it("updates the fields when a different user is chosen", () => {
      const { rerender, onOpenChange } = renderComponent();

      rerender(
        <EditUserDialog
          chosenUser={
            {
              ...chosenUser,
              id: "user-2",
              name: "Alex Jones",
              email: "alex@example.com",
            } as User
          }
          open
          onOpenChange={onOpenChange}
        />,
      );

      expect(getNameInput()).toHaveValue("Alex Jones");
      expect(getEmailInput()).toHaveValue("alex@example.com");
    });
  });

  describe("closing", () => {
    it("closes and resets the form when Cancel is clicked", async () => {
      const { user, onOpenChange } = renderComponent();

      await user.clear(getNameInput());
      await user.type(getNameInput(), "Changed Name");
      expect(getNameInput()).toHaveValue("Changed Name");

      await user.click(getCancelButton());

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(getNameInput()).toHaveValue("Sam Smith");
      expect(getSaveButton()).toBeDisabled();
    });

    it("closes and resets the form when dismissed with Escape", async () => {
      const { user, onOpenChange } = renderComponent();

      await user.clear(getNameInput());
      await user.type(getNameInput(), "Changed Name");
      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(getNameInput()).toHaveValue("Sam Smith");
    });

    it("ignores close attempts while the form is submitting", async () => {
      let resolveToast!: (ok: boolean) => void;
      mockToastNotifications.mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            resolveToast = resolve;
          }),
      );
      const { user, onOpenChange } = renderComponent();

      await user.clear(getNameInput());
      await user.type(getNameInput(), "New Name");
      await user.click(getSaveButton());

      await waitFor(() => expect(getCancelButton()).toBeDisabled());
      expect(getSaveButton()).toBeDisabled();

      await user.keyboard("{Escape}");

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(getNameInput()).toHaveValue("New Name");

      await act(async () => {
        resolveToast(true);
      });

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });
  });

  describe("validation", () => {
    it("shows a name error and does not submit when the name is empty", async () => {
      const { user, onOpenChange } = renderComponent();

      await user.clear(getNameInput());
      fireEvent.submit(getForm());

      await waitFor(() =>
        expect(getNameInput()).toHaveAttribute("aria-invalid", "true"),
      );
      expect(getEmailInput()).toHaveAttribute("aria-invalid", "false");
      expect(mockListUsers).not.toHaveBeenCalled();
      expect(mockToastNotifications).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("shows an email error and does not submit when the email is invalid", async () => {
      const { onOpenChange } = renderComponent();

      fireEvent.change(getEmailInput(), { target: { value: "not-an-email" } });
      fireEvent.submit(getForm());

      await waitFor(() =>
        expect(getEmailInput()).toHaveAttribute("aria-invalid", "true"),
      );
      expect(getNameInput()).toHaveAttribute("aria-invalid", "false");
      expect(mockListUsers).not.toHaveBeenCalled();
      expect(mockToastNotifications).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("submitting", () => {
    it("saves a name change without checking for duplicate emails", async () => {
      const { user, onOpenChange } = renderComponent();

      await user.clear(getNameInput());
      await user.type(getNameInput(), "New Name");
      await user.click(getSaveButton());

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(mockListUsers).not.toHaveBeenCalled();
      expect(mockToastNotifications).toHaveBeenCalledWith(
        expect.any(Function),
        "User updated",
        "Couldn't save changes",
      );
      expect(mockUpdateUser).toHaveBeenCalledWith({
        userId: "user-1",
        data: { name: "New Name", email: "sam@example.com" },
      });
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("checks for duplicates and saves when the new email is unused", async () => {
      const { onOpenChange } = renderComponent();

      fireEvent.change(getEmailInput(), {
        target: { value: "new@example.com" },
      });
      fireEvent.submit(getForm());

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(mockListUsers).toHaveBeenCalledWith({
        query: {
          filterField: "email",
          filterValue: "new@example.com",
          filterOperator: "eq",
          limit: 1,
        },
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        userId: "user-1",
        data: { name: "Sam Smith", email: "new@example.com" },
      });
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("saves when the only match for the new email is the same user", async () => {
      mockListUsers.mockResolvedValue({
        data: { users: [{ id: "user-1", email: "new@example.com" }] },
      });
      const { onOpenChange } = renderComponent();

      fireEvent.change(getEmailInput(), {
        target: { value: "new@example.com" },
      });
      fireEvent.submit(getForm());

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["no data", { data: null }],
      ["no users list", { data: {} }],
    ])(
      "saves when the duplicate check returns %s",
      async (_label, response) => {
        mockListUsers.mockResolvedValue(response);
        const { onOpenChange } = renderComponent();

        fireEvent.change(getEmailInput(), {
          target: { value: "new@example.com" },
        });
        fireEvent.submit(getForm());

        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
        expect(mockUpdateUser).toHaveBeenCalledTimes(1);
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      },
    );

    it("shows an error and does not save when another account has the email", async () => {
      mockListUsers.mockResolvedValue({
        data: { users: [{ id: "user-2", email: "taken@example.com" }] },
      });
      const { onOpenChange } = renderComponent();

      fireEvent.change(getEmailInput(), {
        target: { value: "taken@example.com" },
      });
      fireEvent.submit(getForm());

      expect(
        await screen.findByText("An account with this email already exists."),
      ).toBeInTheDocument();
      expect(getEmailInput()).toHaveAttribute("aria-invalid", "true");
      expect(mockToastNotifications).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("shows a root error and does not save when the duplicate check fails", async () => {
      mockListUsers.mockRejectedValue(new Error("network"));
      const { onOpenChange } = renderComponent();

      fireEvent.change(getEmailInput(), {
        target: { value: "new@example.com" },
      });
      fireEvent.submit(getForm());

      expect(
        await screen.findByText("Couldn't check that email. Please try again."),
      ).toBeInTheDocument();
      expect(mockToastNotifications).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("keeps the dialog open and skips the refresh when saving fails", async () => {
      mockToastNotifications.mockResolvedValue(false);
      const { user, onOpenChange } = renderComponent();

      await user.clear(getNameInput());
      await user.type(getNameInput(), "New Name");
      await user.click(getSaveButton());

      await waitFor(() => expect(mockToastNotifications).toHaveBeenCalled());
      await waitFor(() => expect(getSaveButton()).toBeEnabled());
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
