import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminActions from "@/components/ui/dashboard/admin/adminactions";
import { authClient } from "@/lib/auth-client";

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

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));

const mockAuthClient = authClient as unknown as {
  admin: {
    unbanUser: jest.Mock;
    banUser: jest.Mock;
    setRole: jest.Mock;
    removeUser: jest.Mock;
  };
};

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

describe("AdminActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(mockRefresh).toHaveBeenCalled();
    });
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
      expect(mockRefresh).toHaveBeenCalled();
    });
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
      expect(mockRefresh).toHaveBeenCalled();
    });
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
      expect(mockRefresh).toHaveBeenCalled();
    });
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
    expect(deleteBtn).toHaveAttribute("data-variant", "destructive");
  });

  it("navigates to edit page when Edit is clicked", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    await userEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/admin/edit/user-1");
  });

  it("hides Edit item when hideEdit is true", async () => {
    render(<AdminActions {...baseUser} hideEdit={true} />);
    await openDropdown();
    expect(
      screen.queryByRole("menuitem", { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  it("hides separator when hideEdit is true", async () => {
    render(<AdminActions {...baseUser} hideEdit={true} />);
    await openDropdown();
    expect(document.querySelectorAll("hr")).toHaveLength(1);
  });

  it("shows separator between Edit and account status when hideEdit is false", async () => {
    render(<AdminActions {...baseUser} />);
    await openDropdown();
    expect(document.querySelectorAll("hr")).toHaveLength(2);
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
