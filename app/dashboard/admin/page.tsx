import { auth, User } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getPaginationItems } from "@/lib/utils";
import AdminActions from "@/components/ui/dashboard/admin/adminactions";
import SortableHeader from "@/components/ui/dashboard/admin/sortableheader";
import SearchFilters from "@/components/ui/dashboard/admin/searchfilters";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sortBy?: string;
    sortDirection?: string;
    filterField?: string;
    filterValue?: string;
    filterOperator?: string;
  }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const currentUserId = session.user.id;

  const {
    page,
    sortBy,
    sortDirection,
    filterField,
    filterValue,
    filterOperator,
  } = await searchParams;
  const parsed = Number.parseInt(page ?? "", 10);
  const currentPage = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
  const pageSize = 10;

  const validSortFields = ["name", "email", "createdAt", "role"] as const;
  type SortField = (typeof validSortFields)[number];

  const resolvedSortBy: SortField = validSortFields.includes(
    sortBy as SortField,
  )
    ? (sortBy as SortField)
    : "name";
  const resolvedSortDirection = sortDirection === "desc" ? "desc" : "asc";

  const validFilterFields = ["role", "banned", "createdAt"] as const;
  const validFilterOperators = [
    "in",
    "contains",
    "starts_with",
    "ends_with",
    "eq",
    "ne",
    "gt",
    "gte",
    "lt",
    "lte",
    "not_in",
  ] as const;

  type FilterOperator = (typeof validFilterOperators)[number];

  const resolvedFilterField = validFilterFields.find((f) => f === filterField);
  const resolvedFilterOperator: FilterOperator | undefined =
    validFilterOperators.includes(filterOperator as FilterOperator)
      ? (filterOperator as FilterOperator)
      : undefined;

  const activeFilter =
    resolvedFilterField && resolvedFilterOperator && filterValue
      ? {
          filterField: resolvedFilterField,
          filterValue,
          filterOperator: resolvedFilterOperator,
        }
      : undefined;

  const currentFilter = activeFilter
    ? [
        activeFilter.filterField,
        activeFilter.filterValue,
        activeFilter.filterOperator,
      ].join("--")
    : "none";

  const users = await auth.api.listUsers({
    query: {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy: resolvedSortBy,
      sortDirection: resolvedSortDirection,
      ...activeFilter,
    },
    headers: await headers(),
  });

  const pageHref = (p: number) => {
    const params = new URLSearchParams({
      sortBy: resolvedSortBy,
      sortDirection: resolvedSortDirection,
    });
    if (activeFilter) {
      params.set("filterField", activeFilter.filterField);
      params.set("filterValue", activeFilter.filterValue);
      params.set("filterOperator", activeFilter.filterOperator);
    }
    params.set("page", String(p));
    return "?" + params.toString();
  };

  const totalUsers = users.total;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  if (currentPage > totalPages) {
    redirect("/dashboard/admin" + pageHref(totalPages));
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoString = sevenDaysAgo.toISOString().slice(0, 10);

  const ariaSort = (
    field: SortField,
  ): "ascending" | "descending" | undefined =>
    resolvedSortBy !== field
      ? undefined
      : resolvedSortDirection === "asc"
        ? "ascending"
        : "descending";

  return (
    <div className="flex h-full max-w-screen flex-col px-3 md:px-2">
      <h1 className="mb-4 flex flex-wrap text-xl font-bold text-gray-800 md:text-2xl dark:text-gray-200">
        Admin - User Management
      </h1>
      <div>
        <div className="mb-4 flex flex-col gap-4 whitespace-nowrap md:flex-row md:flex-wrap">
          <SearchFilters
            label="Admins Only"
            field="role"
            value="admin"
            operator="eq"
            currentFilter={currentFilter}
          />
          <SearchFilters
            label="Users Only"
            field="role"
            value="user"
            operator="eq"
            currentFilter={currentFilter}
          />
          <SearchFilters
            label="Banned"
            field="banned"
            value="true"
            operator="eq"
            currentFilter={currentFilter}
          />
          <SearchFilters
            label="New Users (Last 7 days)"
            field="createdAt"
            value={sevenDaysAgoString}
            operator="gte"
            currentFilter={currentFilter}
          />
        </div>
        <div className="overflow-auto rounded-xl border border-stone-300 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="sticky left-0 z-10 bg-stone-50 px-4 py-3 dark:bg-gray-950"
                  aria-sort={ariaSort("name")}
                >
                  <SortableHeader
                    field="name"
                    label="Name"
                    currentSortBy={resolvedSortBy}
                    currentSortDirection={resolvedSortDirection}
                  />
                </TableHead>
                <TableHead className="px-4 py-3" aria-sort={ariaSort("email")}>
                  <SortableHeader
                    field="email"
                    label="Email"
                    currentSortBy={resolvedSortBy}
                    currentSortDirection={resolvedSortDirection}
                  />
                </TableHead>
                <TableHead className="px-4 py-3" aria-sort={ariaSort("role")}>
                  <SortableHeader
                    field="role"
                    label="Role"
                    currentSortBy={resolvedSortBy}
                    currentSortDirection={resolvedSortDirection}
                  />
                </TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Status Reason</TableHead>
                <TableHead
                  className="px-4 py-3"
                  aria-sort={ariaSort("createdAt")}
                >
                  <SortableHeader
                    field="createdAt"
                    label="Created"
                    currentSortBy={resolvedSortBy}
                    currentSortDirection={resolvedSortDirection}
                  />
                </TableHead>
                <TableHead className="px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    No users match these filters.
                  </TableCell>
                </TableRow>
              )}
              {users.users.map((user: User) => (
                <TableRow
                  key={user.id}
                  className="border-t border-stone-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                >
                  <TableCell className="sticky left-0 z-10 bg-white px-4 py-3 dark:bg-gray-900">
                    {user.name}
                  </TableCell>
                  <TableCell className="px-4 py-3">{user.email}</TableCell>
                  <TableCell className="px-4 py-3 capitalize">
                    {user.role === "admin" ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Admin
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        User
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {user.banned ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                        Banned
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {user.banReason || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {new Date(user.createdAt).toLocaleDateString("en-NZ")}{" "}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <AdminActions {...user} currentUserId={currentUserId} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between md:flex-row">
            <p className="w-full text-center text-sm text-gray-600 md:w-1/4 md:max-w-32 md:text-left dark:text-gray-400">
              Page {currentPage} of {totalPages}
              <br />
              {totalUsers} users total
            </p>
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={pageHref(currentPage - 1)} />
                  </PaginationItem>
                )}

                {getPaginationItems(currentPage, totalPages).map((item, i) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={"ellipsis-" + i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href={pageHref(item)}
                        isActive={item === currentPage}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={pageHref(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
            <p className="hidden w-1/4 max-w-32 text-right text-sm text-gray-600 md:flex dark:text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}
