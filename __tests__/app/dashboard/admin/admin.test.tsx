import { render, screen, within } from "@testing-library/react";
import React from "react";

const mockRedirect = jest.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: (url: string) => mockRedirect(url),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
    toString: jest.fn(() => ""),
  })),
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

const capturedAdminActionsProps: Record<string, unknown>[] = [];
jest.mock("@/components/ui/dashboard/admin/adminactions", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedAdminActionsProps.push(props);
    return <div data-testid={`admin-actions-${props.id}`} />;
  },
}));

jest.mock(
  "@/components/ui/table",
  () => require("@/testing/mocks/shadcn").tableMock,
);

jest.mock(
  "@/components/ui/pagination",
  () => require("@/testing/mocks/shadcn").paginationMock,
);

jest.mock("@/components/ui/dashboard/admin/sortableheader", () => ({
  __esModule: true,
  default: ({
    field,
    label,
    currentSortBy,
    currentSortDirection,
  }: {
    field: string;
    label: string;
    currentSortBy: string;
    currentSortDirection: string;
  }) => (
    <button
      data-testid={`sort-${field}`}
      data-active={currentSortBy === field}
      data-direction={currentSortDirection}
    >
      {label}
    </button>
  ),
}));

jest.mock("@/components/ui/dashboard/admin/searchfilters", () => ({
  __esModule: true,
  default: ({
    label,
    field,
    value,
    operator,
    currentFilter,
  }: {
    label: string;
    field: string;
    value: string;
    operator: string;
    currentFilter: string;
  }) => (
    <button
      data-testid={`filter-${field}-${value}`}
      data-filteractive={currentFilter === `${field}--${value}--${operator}`}
      data-value={value}
    >
      {label}
    </button>
  ),
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

const makeSearchParams = (
  params: {
    page?: string;
    sortBy?: string;
    sortDirection?: string;
    filterField?: string;
    filterValue?: string;
    filterOperator?: string;
  } = {},
) => Promise.resolve(params);

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

const listUsersQuery = () => mockListUsers.mock.calls[0][0].query;

beforeEach(() => {
  jest.clearAllMocks();
  capturedAdminActionsProps.length = 0;
  mockHeaders.mockResolvedValue({});
  mockGetPaginationItems.mockReturnValue([1]);
});

describe("AdminDashboard", () => {
  describe("session guard", () => {
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

    it("does not list users when the session guard redirects", async () => {
      mockGetSession.mockResolvedValue(null);
      await expect(
        AdminDashboard({ searchParams: makeSearchParams() }),
      ).rejects.toThrow();
      expect(mockListUsers).not.toHaveBeenCalled();
    });
  });

  describe("admin page rendering", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(adminSession);
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
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("does not render the empty state when users exist", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(
        screen.queryByText("No users match these filters."),
      ).not.toBeInTheDocument();
    });

    it("renders the empty state and no rows when there are no users", async () => {
      makeListUsers([], 0);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(
        screen.getByText("No users match these filters."),
      ).toBeInTheDocument();
      expect(capturedAdminActionsProps).toHaveLength(0);
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
      const row = screen.getByText("Violation of ToS").closest("tr")!;
      expect(within(row).getByText("Banned")).toBeInTheDocument();
      expect(within(row).getByText("Violation of ToS")).toBeInTheDocument();
    });

    it("renders '-' when banReason is null", async () => {
      makeListUsers([{ ...baseUser, banned: false, banReason: null }], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("renders createdAt formatted for en-NZ", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      const formatted = new Date("2024-01-15T00:00:00Z").toLocaleDateString(
        "en-NZ",
      );
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });

    it("renders AdminActions for each user", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByTestId("admin-actions-user-1")).toBeInTheDocument();
    });

    it("passes currentUserId to AdminActions", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(capturedAdminActionsProps[0].currentUserId).toBe("admin-1");
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

  describe("listUsers query", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(adminSession);
    });

    it("passes default sort params to listUsers when none provided", async () => {
      makeListUsers([baseUser], 1);
      await AdminDashboard({ searchParams: makeSearchParams() });
      expect(mockListUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            sortBy: "name",
            sortDirection: "asc",
          }),
        }),
      );
    });

    it("passes valid sortBy param to listUsers", async () => {
      makeListUsers([baseUser], 1);
      await AdminDashboard({
        searchParams: makeSearchParams({ sortBy: "email" }),
      });
      expect(listUsersQuery().sortBy).toBe("email");
    });

    it("falls back to name sort for invalid sortBy param", async () => {
      makeListUsers([baseUser], 1);
      await AdminDashboard({
        searchParams: makeSearchParams({ sortBy: "invalid" }),
      });
      expect(listUsersQuery().sortBy).toBe("name");
    });

    it("passes desc sortDirection to listUsers", async () => {
      makeListUsers([baseUser], 1);
      await AdminDashboard({
        searchParams: makeSearchParams({
          sortBy: "name",
          sortDirection: "desc",
        }),
      });
      expect(listUsersQuery().sortDirection).toBe("desc");
    });

    it("falls back to asc for invalid sortDirection param", async () => {
      makeListUsers([baseUser], 1);
      await AdminDashboard({
        searchParams: makeSearchParams({ sortDirection: "sideways" }),
      });
      expect(listUsersQuery().sortDirection).toBe("asc");
    });

    it("passes limit 10 and offset 0 to listUsers on the first page", async () => {
      makeListUsers([baseUser], 1);
      await AdminDashboard({ searchParams: makeSearchParams() });
      expect(listUsersQuery()).toEqual(
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
    });

    it("passes the request headers to listUsers", async () => {
      mockHeaders.mockResolvedValue({ cookie: "session=abc" });
      makeListUsers([baseUser], 1);
      await AdminDashboard({ searchParams: makeSearchParams() });
      expect(mockListUsers).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { cookie: "session=abc" } }),
      );
    });

    it("passes filterField, filterValue and filterOperator to listUsers", async () => {
      makeListUsers([baseUser], 1);
      await AdminDashboard({
        searchParams: makeSearchParams({
          filterField: "role",
          filterValue: "admin",
          filterOperator: "eq",
        }),
      });
      expect(listUsersQuery()).toEqual(
        expect.objectContaining({
          filterField: "role",
          filterValue: "admin",
          filterOperator: "eq",
        }),
      );
    });

    it.each([
      [
        "an invalid filterField",
        { filterField: "name", filterValue: "admin", filterOperator: "eq" },
      ],
      [
        "an invalid filterOperator",
        { filterField: "role", filterValue: "admin", filterOperator: "bogus" },
      ],
      ["a missing filterField", { filterValue: "admin", filterOperator: "eq" }],
      [
        "a missing filterOperator",
        { filterField: "role", filterValue: "admin" },
      ],
      ["a missing filterValue", { filterField: "role", filterOperator: "eq" }],
      [
        "an empty filterValue",
        { filterField: "role", filterValue: "", filterOperator: "eq" },
      ],
    ])("applies no filter for %s", async (_label, filterParams) => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({
        searchParams: makeSearchParams(filterParams),
      });
      render(el);
      const query = listUsersQuery();
      expect(query).not.toHaveProperty("filterField");
      expect(query).not.toHaveProperty("filterValue");
      expect(query).not.toHaveProperty("filterOperator");
      expect(screen.getByTestId("filter-role-admin")).toHaveAttribute(
        "data-filteractive",
        "false",
      );
    });
  });

  describe("sorting and filter controls", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(adminSession);
    });

    it("renders SortableHeader for name, email, role, and createdAt columns", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByTestId("sort-name")).toBeInTheDocument();
      expect(screen.getByTestId("sort-email")).toBeInTheDocument();
      expect(screen.getByTestId("sort-role")).toBeInTheDocument();
      expect(screen.getByTestId("sort-createdAt")).toBeInTheDocument();
    });

    it("marks the active sort field correctly", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ sortBy: "email" }),
      });
      render(el);
      expect(screen.getByTestId("sort-email")).toHaveAttribute(
        "data-active",
        "true",
      );
      expect(screen.getByTestId("sort-name")).toHaveAttribute(
        "data-active",
        "false",
      );
    });

    it("passes sortDirection to SortableHeader", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ sortDirection: "desc" }),
      });
      render(el);
      expect(screen.getByTestId("sort-name")).toHaveAttribute(
        "data-direction",
        "desc",
      );
    });

    it("sets aria-sort ascending on the default sorted column only", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).toHaveAttribute("aria-sort", "ascending");
      expect(
        screen.getByRole("columnheader", { name: "Email" }),
      ).not.toHaveAttribute("aria-sort");
      expect(
        screen.getByRole("columnheader", { name: "Role" }),
      ).not.toHaveAttribute("aria-sort");
      expect(
        screen.getByRole("columnheader", { name: "Created" }),
      ).not.toHaveAttribute("aria-sort");
    });

    it("sets aria-sort descending on the sorted column when sorting descending", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({
          sortBy: "email",
          sortDirection: "desc",
        }),
      });
      render(el);
      expect(
        screen.getByRole("columnheader", { name: "Email" }),
      ).toHaveAttribute("aria-sort", "descending");
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).not.toHaveAttribute("aria-sort");
    });

    it("does not set aria-sort on non-sortable columns", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(
        screen.getByRole("columnheader", { name: "Status" }),
      ).not.toHaveAttribute("aria-sort");
      expect(
        screen.getByRole("columnheader", { name: "Status Reason" }),
      ).not.toHaveAttribute("aria-sort");
      expect(
        screen.getByRole("columnheader", { name: "Actions" }),
      ).not.toHaveAttribute("aria-sort");
    });

    it("renders all four SearchFilters", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByText("Admins Only")).toBeInTheDocument();
      expect(screen.getByText("Users Only")).toBeInTheDocument();
      expect(screen.getByText("Banned")).toBeInTheDocument();
      expect(screen.getByText("New Users (Last 7 days)")).toBeInTheDocument();
    });

    it("marks no SearchFilter as active when no filter params provided", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({ searchParams: makeSearchParams() });
      render(el);
      expect(screen.getByTestId("filter-role-admin")).toHaveAttribute(
        "data-filteractive",
        "false",
      );
      expect(screen.getByTestId("filter-role-user")).toHaveAttribute(
        "data-filteractive",
        "false",
      );
    });

    it("marks the matching SearchFilter as active when filter params match", async () => {
      makeListUsers([baseUser], 1);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({
          filterField: "role",
          filterValue: "admin",
          filterOperator: "eq",
        }),
      });
      render(el);
      expect(screen.getByTestId("filter-role-admin")).toHaveAttribute(
        "data-filteractive",
        "true",
      );
      expect(screen.getByTestId("filter-role-user")).toHaveAttribute(
        "data-filteractive",
        "false",
      );
    });

    describe("new users filter date", () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2024-03-15T12:00:00Z").getTime());
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it("passes the date seven days ago as an ISO date to the createdAt SearchFilter", async () => {
        makeListUsers([baseUser], 1);
        const el = await AdminDashboard({ searchParams: makeSearchParams() });
        render(el);
        expect(
          screen.getByTestId("filter-createdAt-2024-03-08"),
        ).toHaveAttribute("data-value", "2024-03-08");
      });
    });
  });

  describe("pagination", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(adminSession);
    });

    it("renders page info and pagination when totalPages > 1", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "1" }),
      });
      render(el);
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      expect(screen.getByText(/11 users total/)).toBeInTheDocument();
    });

    it("does not render Previous link on first page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "1" }),
      });
      render(el);
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    });

    it("renders Next link when currentPage < totalPages", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "1" }),
      });
      render(el);
      const next = screen.getByText("Next");
      expect(next).toBeInTheDocument();
      expect(next).toHaveAttribute(
        "href",
        "?sortBy=name&sortDirection=asc&page=2",
      );
    });

    it("renders Previous link when currentPage > 1", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "2" }),
      });
      render(el);
      const prev = screen.getByText("Previous");
      expect(prev).toBeInTheDocument();
      expect(prev).toHaveAttribute(
        "href",
        "?sortBy=name&sortDirection=asc&page=1",
      );
    });

    it("does not render Next link on last page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "2" }),
      });
      render(el);
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("renders page number links", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "1" }),
      });
      render(el);
      const pageOneLink = screen.getByRole("link", { name: "1" });
      expect(pageOneLink).toHaveAttribute(
        "href",
        "?sortBy=name&sortDirection=asc&page=1",
      );
      expect(pageOneLink).toHaveAttribute("aria-current", "page");
      const pageTwoLink = screen.getByRole("link", { name: "2" });
      expect(pageTwoLink).toHaveAttribute(
        "href",
        "?sortBy=name&sortDirection=asc&page=2",
      );
      expect(pageTwoLink).not.toHaveAttribute("aria-current");
    });

    it("keeps the resolved sort in pagination links", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({
          page: "1",
          sortBy: "email",
          sortDirection: "desc",
        }),
      });
      render(el);
      expect(screen.getByText("Next")).toHaveAttribute(
        "href",
        "?sortBy=email&sortDirection=desc&page=2",
      );
    });

    it("keeps the active filter in pagination links", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({
          page: "1",
          filterField: "role",
          filterValue: "admin",
          filterOperator: "eq",
        }),
      });
      render(el);
      expect(screen.getByText("Next")).toHaveAttribute(
        "href",
        "?sortBy=name&sortDirection=asc&filterField=role&filterValue=admin&filterOperator=eq&page=2",
      );
    });

    it("renders ellipsis items from getPaginationItems", async () => {
      mockGetPaginationItems.mockReturnValue([1, "ellipsis", 5]);
      makeListUsers([baseUser], 50);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "1" }),
      });
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

    it.each(["abc", "0", "-3", "99999999999999999999"])(
      "falls back to page 1 for invalid page param %s",
      async (page) => {
        mockGetPaginationItems.mockReturnValue([1, 2]);
        makeListUsers([baseUser], 11);
        const el = await AdminDashboard({
          searchParams: makeSearchParams({ page }),
        });
        render(el);
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
        expect(listUsersQuery().offset).toBe(0);
      },
    );

    it("passes correct offset to listUsers based on page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      await AdminDashboard({ searchParams: makeSearchParams({ page: "2" }) });
      expect(listUsersQuery().offset).toBe(10);
    });

    it("renders both Previous and Next on a middle page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2, 3]);
      makeListUsers([baseUser], 21);
      const el = await AdminDashboard({
        searchParams: makeSearchParams({ page: "2" }),
      });
      render(el);
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("redirects to the last page when the requested page is beyond it", async () => {
      makeListUsers([], 11);
      await expect(
        AdminDashboard({ searchParams: makeSearchParams({ page: "5" }) }),
      ).rejects.toThrow(
        "NEXT_REDIRECT:/dashboard/admin?sortBy=name&sortDirection=asc&page=2",
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        "/dashboard/admin?sortBy=name&sortDirection=asc&page=2",
      );
    });

    it("redirects to page 1 when the requested page is beyond an empty result", async () => {
      makeListUsers([], 0);
      await expect(
        AdminDashboard({ searchParams: makeSearchParams({ page: "3" }) }),
      ).rejects.toThrow(
        "NEXT_REDIRECT:/dashboard/admin?sortBy=name&sortDirection=asc&page=1",
      );
    });

    it("keeps sort and filter in the out-of-range redirect", async () => {
      makeListUsers([], 11);
      await expect(
        AdminDashboard({
          searchParams: makeSearchParams({
            page: "9",
            sortBy: "role",
            sortDirection: "desc",
            filterField: "banned",
            filterValue: "true",
            filterOperator: "eq",
          }),
        }),
      ).rejects.toThrow(
        "NEXT_REDIRECT:/dashboard/admin?sortBy=role&sortDirection=desc&filterField=banned&filterValue=true&filterOperator=eq&page=2",
      );
    });

    it("does not redirect when the requested page is the last page", async () => {
      mockGetPaginationItems.mockReturnValue([1, 2]);
      makeListUsers([baseUser], 11);
      await AdminDashboard({ searchParams: makeSearchParams({ page: "2" }) });
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
