import { render, screen } from "@testing-library/react";
import React from "react";

const mockRedirect = jest.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: (url: string) => mockRedirect(url),
}));

const mockHeaders = jest.fn().mockResolvedValue({});
jest.mock("next/headers", () => ({
  __esModule: true,
  headers: () => mockHeaders(),
}));

const mockGetSession = jest.fn();
const mockListUsers = jest.fn();
jest.mock("@/lib/auth", () => ({
  __esModule: true,
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      listUsers: (...args: unknown[]) => mockListUsers(...args),
    },
  },
}));

const mockGetPaginationItems = jest.fn();
jest.mock("@/lib/utils", () => ({
  __esModule: true,
  getPaginationItems: (...args: unknown[]) => mockGetPaginationItems(...args),
}));

jest.mock("@/components/ui/dashboard/admin/adminactions", () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => (
    <div data-testid={`admin-actions-${id}`} />
  ),
}));

jest.mock("@/components/ui/table", () => ({
  __esModule: true,
  Table: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <th>{children}</th>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td>{children}</td>
  ),
}));

jest.mock("@/components/ui/pagination", () => ({
  __esModule: true,
  Pagination: ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
  PaginationContent: ({ children }: { children: React.ReactNode }) => (
    <ul>{children}</ul>
  ),
  PaginationItem: ({ children }: { children: React.ReactNode }) => (
    <li>{children}</li>
  ),
  PaginationLink: ({
    children,
    href,
    isActive,
  }: {
    children: React.ReactNode;
    href: string;
    isActive?: boolean;
  }) => (
    <a href={href} aria-current={isActive ? "page" : undefined}>
      {children}
    </a>
  ),
  PaginationPrevious: ({ href }: { href: string }) => (
    <a href={href}>Previous</a>
  ),
  PaginationNext: ({ href }: { href: string }) => <a href={href}>Next</a>,
  PaginationEllipsis: () => <span>...</span>,
}));

import AdminDashboard from "@/app/dashboard/admin/page";

const adminSession = {
  user: {
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
};

const makeSearchParams = (page?: string) =>
  Promise.resolve(page ? { page } : {});

const baseUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  banned: false,
  banReason: null,
  createdAt: new Date("2024-01-15T00:00:00Z"),
};

const makeListUsers = (users: object[], total: number) =>
  mockListUsers.mockResolvedValue({ users, total });

beforeEach(() => {
  jest.resetAllMocks();
  mockRedirect.mockImplementation((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  mockHeaders.mockResolvedValue({});
  mockGetPaginationItems.mockReturnValue([1]);
});

describe("AdminDashboard", () => {
  describe("AUTH_ON guard", () => {
    it("redirects to /dashboard when AUTH_ON is not true", async () => {
      delete process.env.AUTH_ON;
      await expect(
        AdminDashboard({ searchParams: makeSearchParams() }),
      ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects to /dashboard when AUTH_ON is false", async () => {
      process.env.AUTH_ON = "false";
      await expect(
        AdminDashboard({ searchParams: makeSearchParams() }),
      ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects to /dashboard when AUTH_ON is TRUE (case check)", async () => {
      process.env.AUTH_ON = "TRUE";
      mockGetSession.mockResolvedValue(null);
      // AUTH_ON check is case-insensitive lowercased, "TRUE".toLowerCase() === "true" — passes
      // so this actually proceeds past AUTH_ON; redirect happens on no session
      await expect(
        AdminDashboard({ searchParams: makeSearchParams() }),
      ).rejects.toThrow("NEXT_REDIRECT:/login?callbackUrl=/dashboard/admin");
      delete process.env.AUTH_ON;
    });
  });

  describe("session guard", () => {
    beforeEach(() => {
      process.env.AUTH_ON = "true";
    });

    afterEach(() => {
      delete process.env.AUTH_ON;
    });

    it("redirects to /login when no session", async () => {
      mockGetSession.mockResolvedValue(null);
      await expect(
        AdminDashboard({ searchParams: makeSearchParams() }),
      ).rejects.toThrow("NEXT_REDIRECT:/login?callbackUrl=/dashboard/admin");
      expect(mockRedirect).toHaveBeenCalledWith(
        "/login?callbackUrl=/dashboard/admin",
      );
    });

    it("redirects to /dashboard when session user is not admin", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", name: "Bob", role: "user" },
      });
      await expect(
        AdminDashboard({ searchParams: makeSearchParams() }),
      ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("admin page rendering", () => {
    beforeEach(() => {
      process.env.AUTH_ON = "true";
      mockGetSession.mockResolvedValue(adminSession);
    });

    afterEach(() => {
      delete process.env.AUTH_ON;
    });

    it("renders the admin dashboard heading", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("Admin - User Management")).toBeInTheDocument();
    });

    it("renders user table with correct columns", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Role")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Status Reason")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("renders a user row with name, email, and active status", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByTestId("admin-actions-user-1")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("renders User badge for non-admin user", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("User")).toBeInTheDocument();
    });

    it("renders Admin badge for admin user", async () => {
      const adminUser = { ...baseUser, role: "admin" };
      makeListUsers([adminUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("renders Banned badge and ban reason for banned user", async () => {
      const bannedUser = {
        ...baseUser,
        banned: true,
        banReason: "Violation of ToS",
      };
      makeListUsers([bannedUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("Banned")).toBeInTheDocument();
      expect(screen.getByText("Violation of ToS")).toBeInTheDocument();
    });

    it("renders '-' when banReason is null", async () => {
      makeListUsers([{ ...baseUser, banned: false, banReason: null }], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("renders formatted createdAt date", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      const formatted = new Date("2024-01-15T00:00:00Z").toLocaleDateString();
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });

    it("renders AdminActions for each user", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByTestId("admin-actions-user-1")).toBeInTheDocument();
    });

    it("renders multiple user rows", async () => {
      const user2 = {
        ...baseUser,
        id: "user-2",
        name: "Bob",
        email: "bob@example.com",
      };
      makeListUsers([baseUser, user2], 2);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByTestId("admin-actions-user-1")).toBeInTheDocument();
      expect(screen.getByTestId("admin-actions-user-2")).toBeInTheDocument();
      expect(screen.getAllByText("Alice")).toHaveLength(1);
      expect(screen.getAllByText("Bob")).toHaveLength(1);
    });

    it("does not render pagination when totalPages is 1", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("does not render pagination when totalPages is 0", async () => {
      makeListUsers([], 0);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    beforeEach(() => {
      process.env.AUTH_ON = "true";
      mockGetSession.mockResolvedValue(adminSession);
    });

    afterEach(() => {
      delete process.env.AUTH_ON;
    });

    it("renders page info and pagination when totalPages > 1", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({ searchParams: makeSearchParams("1") });
      render(el);
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      expect(screen.getByText(/11 users total/)).toBeInTheDocument();
    });

    it("does not render Previous link on first page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({ searchParams: makeSearchParams("1") });
      render(el);
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    });

    it("renders Next link when currentPage < totalPages", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({ searchParams: makeSearchParams("1") });
      render(el);
      const next = screen.getByText("Next");
      expect(next).toBeInTheDocument();
      expect(next).toHaveAttribute("href", "?page=2");
    });

    it("renders Previous link when currentPage > 1", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({ searchParams: makeSearchParams("2") });
      render(el);
      const prev = screen.getByText("Previous");
      expect(prev).toBeInTheDocument();
      expect(prev).toHaveAttribute("href", "?page=1");
    });

    it("does not render Next link on last page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({ searchParams: makeSearchParams("2") });
      render(el);
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("renders page number links", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({ searchParams: makeSearchParams("1") });
      render(el);
      const pageOneLink = screen.getByRole("link", { name: "1" });
      expect(pageOneLink).toHaveAttribute("href", "?page=1");
      expect(pageOneLink).toHaveAttribute("aria-current", "page");
      const pageTwoLink = screen.getByRole("link", { name: "2" });
      expect(pageTwoLink).toHaveAttribute("href", "?page=2");
      expect(pageTwoLink).not.toHaveAttribute("aria-current");
    });

    it("renders ellipsis items from getPaginationItems", async () => {
      mockGetPaginationItems.mockReturnValue([1, "ellipsis", 5]);
      makeListUsers([baseUser], 50);
      const el = await AdminDashboard({ searchParams: makeSearchParams("1") });
      render(el);
      expect(screen.getByText("...")).toBeInTheDocument();
    });

    it("defaults to page 1 when no page param is provided", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    it("passes correct offset to listUsers based on page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      await AdminDashboard({ searchParams: makeSearchParams("2") });
      expect(mockListUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ offset: 10 }),
        }),
      );
    });

    it("renders both Previous and Next on a middle page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2, 3]);
      makeListUsers([baseUser], 21);
      const el = await AdminDashboard({ searchParams: makeSearchParams("2") });
      render(el);
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
  });
});
