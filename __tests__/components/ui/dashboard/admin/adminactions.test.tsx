import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminActions from "@/components/ui/dashboard/admin/adminactions";
import { authClient } from "@/lib/auth-client";
import { toastNotifications } from "@/components/general/toast-notifications";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    admin: {
      unbanUser: jest.fn(),
      banUser: jest.fn(),
      setRole: jest.fn(),
      removeUser: jest.fn(),
    },
  },
}));

jest.mock("@/components/general/toast-notifications", () => ({
  toastNotifications: jest.fn(),
}));

jest.mock("@/components/ui/dashboard/admin/edit-user-dialog", () => ({
  EditUserDialog: ({
    chosenUser,
    open,
    onOpenChange,
  }: {
    chosenUser: { name: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Edit user">
        <p>{chosenUser.name}</p>
        <button onClick={() => onOpenChange(false)}>Dismiss</button>
      </div>
    ) : null,
}));

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock("lucide-react", () => ({
  MoreHorizontalIcon: () => <svg data-testid="more-icon" />,
}));

jest.mock("@/lib/defaults", () => ({
  defaultBanReasons: [
    "Account Not Yet Verified",
    "Spamming",
    "T&C Violation",
    "Inappropriate Content",
    "Fraudulent Activity",
  ],
}));

jest.mock("@/components/ui/alert-dialog", () =>
  require("@/testing/mocks/shadcn").alertDialogMock(),
);

jest.mock(
  "@/components/ui/dropdown-menu",
  () => require("@/testing/mocks/shadcn").dropdownMenuMock,
);

const mockAuthClient = authClient as unknown as {
  admin: {
    unbanUser: jest.Mock;
    banUser: jest.Mock;
    setRole: jest.Mock;
    removeUser: jest.Mock;
  };
};

const mockToastNotifications = toastNotifications as unknown as jest.Mock;

const baseUser = {
  id: "user-1",
  currentUserId: "current-user",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: "user" as const,
  banned: false,
  banReason: null,
  banExpires: null,
  image: null,
};

async function openDropdown() {
  await userEvent.click(screen.getByRole("button", { name: /open menu/i }));
}

async function openBanSubMenu() {
  await openDropdown();
  await userEvent.click(screen.getByRole("button", { name: /ban/i }));
}

function toastResolvesWith(ok: boolean) {
  mockToastNotifications.mockImplementation(async (action: () => unknown) => {
    await action();
    return ok;
  });
}

describe("AdminActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toastResolvesWith(true);
  });

  it("renders the trigger button", () => {
    render(<AdminActions {...baseUser} />);
    expect(
      screen.getByRole("button", { name: /open menu/i }),
    ).toBeInTheDocument();
  });

  it("opens the dropdown menu when trigger is clicked", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    expect(screen.getByTestId("dropdown-content")).toBeInTheDocument();
  });

  it("always shows Edit item", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    expect(screen.getByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
  });

  it("shows danger zone items for other users", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    expect(
      screen.getByRole("menuitem", { name: /set as admin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /delete/i }),
    ).toBeInTheDocument();
  });

  it("does not show account status or danger zone for self", async () => {
    render(<AdminActions {...baseUser} currentUserId="user-1" />);
    await openDropdown();
    expect(screen.queryByText(/account status/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /delete/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /set as/i }),
    ).not.toBeInTheDocument();
  });

  it("still shows Edit item for self", async () => {
    render(<AdminActions {...baseUser} currentUserId="user-1" />);
    await openDropdown();
    expect(screen.getByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
  });

  it("renders no separators for self", async () => {
    render(<AdminActions {...baseUser} currentUserId="user-1" />);
    await openDropdown();
    expect(document.querySelectorAll("hr")).toHaveLength(0);
  });

  it("renders separators after Edit and before the danger zone for other users", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    expect(document.querySelectorAll("hr")).toHaveLength(2);
  });

  it("shows Ban sub-trigger when user is not banned", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    expect(screen.getByRole("button", { name: /ban/i })).toBeInTheDocument();
  });

  it("shows Enable item when user is banned", async () => {
    render(<AdminActions {...baseUser} banned={true} />);
    await openDropdown();
    expect(
      screen.getByRole("menuitem", { name: /enable/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^ban$/i }),
    ).not.toBeInTheDocument();
  });

  it("shows all ban reasons in sub-menu", async () => {
    render(<AdminActions {...baseUser} />);
    await openBanSubMenu();
    expect(
      screen.getByRole("menuitem", { name: /account not yet verified/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /spamming/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /t&c violation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /inappropriate content/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /fraudulent activity/i }),
    ).toBeInTheDocument();
  });

  it("does not show the edit dialog until Edit is clicked", () => {
    render(<AdminActions {...baseUser} />);
    expect(
      screen.queryByRole("dialog", { name: /edit user/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the edit dialog for the chosen user when Edit is clicked", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    expect(
      screen.getByRole("dialog", { name: /edit user/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("opens the edit dialog for self", async () => {
    render(<AdminActions {...baseUser} currentUserId="user-1" />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    expect(
      screen.getByRole("dialog", { name: /edit user/i }),
    ).toBeInTheDocument();
  });

  it("closes the edit dialog when it requests to close", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(
      screen.queryByRole("dialog", { name: /edit user/i }),
    ).not.toBeInTheDocument();
  });

  it("calls banUser with correct args and refreshes", async () => {
    mockAuthClient.admin.banUser.mockResolvedValue({});
    render(<AdminActions {...baseUser} />);
    await openBanSubMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /spamming/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.banUser).toHaveBeenCalledWith({
        userId: "user-1",
        banReason: "Spamming",
      });
      expect(mockToastNotifications).toHaveBeenCalledWith(
        expect.any(Function),
        "User banned",
        "Couldn't ban user",
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("does not refresh when banning fails", async () => {
    toastResolvesWith(false);
    mockAuthClient.admin.banUser.mockResolvedValue({});
    render(<AdminActions {...baseUser} />);
    await openBanSubMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /spamming/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.banUser).toHaveBeenCalled();
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("calls unbanUser with correct args and refreshes", async () => {
    mockAuthClient.admin.unbanUser.mockResolvedValue({});
    render(<AdminActions {...baseUser} banned={true} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /enable/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.unbanUser).toHaveBeenCalledWith({
        userId: "user-1",
      });
      expect(mockToastNotifications).toHaveBeenCalledWith(
        expect.any(Function),
        "User enabled",
        "Couldn't enable user",
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("does not refresh when enabling fails", async () => {
    toastResolvesWith(false);
    mockAuthClient.admin.unbanUser.mockResolvedValue({});
    render(<AdminActions {...baseUser} banned={true} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /enable/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.unbanUser).toHaveBeenCalled();
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("shows role dialog and changes role from user to admin", async () => {
    mockAuthClient.admin.setRole.mockResolvedValue({});
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(
      screen.getByRole("menuitem", { name: /set as admin/i }),
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByText(/change this user's role to admin/i),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /change role/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.setRole).toHaveBeenCalledWith({
        userId: "user-1",
        role: "admin",
      });
      expect(mockToastNotifications).toHaveBeenCalledWith(
        expect.any(Function),
        "Role updated",
        "Couldn't change role",
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows role dialog and changes role from admin to user", async () => {
    mockAuthClient.admin.setRole.mockResolvedValue({});
    render(<AdminActions {...baseUser} role="admin" />);
    await openDropdown();
    await userEvent.click(
      screen.getByRole("menuitem", { name: /set as user/i }),
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByText(/change this user's role to user/i),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /change role/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.setRole).toHaveBeenCalledWith({
        userId: "user-1",
        role: "user",
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("closes the role dialog but does not refresh when changing role fails", async () => {
    toastResolvesWith(false);
    mockAuthClient.admin.setRole.mockResolvedValue({});
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(
      screen.getByRole("menuitem", { name: /set as admin/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /change role/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.setRole).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("cancels role dialog without calling setRole", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(
      screen.getByRole("menuitem", { name: /set as admin/i }),
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mockAuthClient.admin.setRole).not.toHaveBeenCalled();
  });

  it("shows delete dialog and removes user", async () => {
    mockAuthClient.admin.removeUser.mockResolvedValue({});
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /delete user/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.removeUser).toHaveBeenCalledWith({
        userId: "user-1",
      });
      expect(mockToastNotifications).toHaveBeenCalledWith(
        expect.any(Function),
        "User removed",
        "Couldn't remove user",
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes the delete dialog but does not refresh when removing fails", async () => {
    toastResolvesWith(false);
    mockAuthClient.admin.removeUser.mockResolvedValue({});
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    await userEvent.click(screen.getByRole("button", { name: /delete user/i }));
    await waitFor(() => {
      expect(mockAuthClient.admin.removeUser).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("cancels delete dialog without calling removeUser", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mockAuthClient.admin.removeUser).not.toHaveBeenCalled();
  });

  it("delete action button has destructive variant", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    const deleteBtn = screen.getByRole("button", { name: /delete user/i });
    expect(deleteBtn.className).toContain("bg-destructive/10");
  });

  it("renders a custom trigger when provided", () => {
    render(
      <AdminActions
        {...baseUser}
        trigger={<button data-testid="custom-trigger">Custom</button>}
      />,
    );
    expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /open menu/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the dropdown when a custom trigger is clicked", async () => {
    render(
      <AdminActions
        {...baseUser}
        trigger={<button data-testid="custom-trigger">Custom</button>}
      />,
    );
    await userEvent.click(screen.getByTestId("custom-trigger"));
    expect(screen.getByTestId("dropdown-content")).toBeInTheDocument();
  });
});
