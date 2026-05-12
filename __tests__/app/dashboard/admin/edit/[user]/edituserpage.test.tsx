import React from "react";
import { render, screen } from "@testing-library/react";
import AdminUserPage from "@/app/dashboard/admin/edit/[user]/page";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("redirect");
  }),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => Promise.resolve(new Headers())),
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      listUserSessions: jest.fn(),
    },
  },
}));

jest.mock("@/components/ui/dashboard/admin/adminactions", () => ({
  __esModule: true,
  default: () => <div data-testid="admin-actions" />,
}));

jest.mock("@/components/ui/dashboard/admin/editUserForm", () => ({
  __esModule: true,
  default: () => <div data-testid="edit-user-form" />,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockGetUser = auth.api.getUser as unknown as jest.Mock;
const mockListUserSessions = auth.api.listUserSessions as unknown as jest.Mock;

const mockParams = (userId: string) => Promise.resolve({ user: userId });

const adminSession = {
  user: { id: "admin-1", role: "admin" },
};

const activeUser = {
  id: "user-123",
  name: "Jane Doe",
  email: "jane@example.com",
  banned: false,
  banReason: null,
};

const bannedUser = {
  ...activeUser,
  banned: true,
  banReason: "Spamming",
};

describe("AdminUserPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListUserSessions.mockResolvedValue({ sessions: [] });
  });

  it("redirects to login when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(
      AdminUserPage({ params: mockParams("user-123") }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=/dashboard/admin",
    );
  });

  it("redirects to /dashboard when user is not an admin", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1", role: "user" } });

    await expect(
      AdminUserPage({ params: mockParams("user-123") }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the page with the chosen user's name", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue(activeUser);

    render(await AdminUserPage({ params: mockParams("user-123") }));

    expect(screen.getByText("Admin Dashboard - Jane Doe")).toBeInTheDocument();
  });

  it("does not show banned badge for an active user", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue(activeUser);

    render(await AdminUserPage({ params: mockParams("user-123") }));

    expect(screen.queryByText(/Banned for:/)).not.toBeInTheDocument();
  });

  it("shows banned badge with reason for a banned user", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue(bannedUser);

    render(await AdminUserPage({ params: mockParams("user-123") }));

    expect(screen.getByText("Banned for: Spamming")).toBeInTheDocument();
  });

  it("shows banned badge with fallback text when no ban reason is set", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue({ ...bannedUser, banReason: null });

    render(await AdminUserPage({ params: mockParams("user-123") }));

    expect(
      screen.getByText("Banned for: No reason provided"),
    ).toBeInTheDocument();
  });

  it("renders the EditUserForm component", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue(activeUser);

    render(await AdminUserPage({ params: mockParams("user-123") }));

    expect(screen.getByTestId("edit-user-form")).toBeInTheDocument();
  });

  it("renders the AdminActions component", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue(activeUser);

    render(await AdminUserPage({ params: mockParams("user-123") }));

    expect(screen.getByTestId("admin-actions")).toBeInTheDocument();
  });

  it("calls getUser with the user id from params", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue(activeUser);

    await AdminUserPage({ params: mockParams("user-123") });

    expect(mockGetUser).toHaveBeenCalledWith(
      expect.objectContaining({ query: { id: "user-123" } }),
    );
  });

  it("calls listUserSessions with the user id from params", async () => {
    mockGetSession.mockResolvedValue(adminSession);
    mockGetUser.mockResolvedValue(activeUser);

    await AdminUserPage({ params: mockParams("user-123") });

    expect(mockListUserSessions).toHaveBeenCalledWith(
      expect.objectContaining({ body: { userId: "user-123" } }),
    );
  });
});
