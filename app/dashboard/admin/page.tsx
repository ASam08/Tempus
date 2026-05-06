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

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const authOn = process.env.AUTH_ON?.toLowerCase() === "true";

  if (!authOn) {
    redirect("/dashboard");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 2;

  const users = await auth.api.listUsers({
    query: {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy: "name",
    },
    headers: await headers(),
  });

  const totalUsers = users.total;
  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className="flex h-full max-w-screen flex-col px-3 py-4 md:px-2">
      <h1 className="flex flex-wrap text-2xl font-bold text-gray-800 md:mb-4 dark:text-gray-200">
        Admin Dashboard
      </h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Welcome, {session.user.name}. You can manage users here.
      </p>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
          User Management
        </h2>
        <div className="overflow-x-auto rounded-xl border border-stone-300 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3">Name</TableHead>
                <TableHead className="px-4 py-3">Email</TableHead>
                <TableHead className="px-4 py-3">Role</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Status Reason</TableHead>
                <TableHead className="px-4 py-3">Created</TableHead>
                <TableHead className="px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.users.map((user: User) => (
                <TableRow
                  key={user.id}
                  className="border-t border-stone-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                >
                  <TableCell className="px-4 py-3">{user.name}</TableCell>
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
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <AdminActions {...user} />
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
                    <PaginationPrevious href={"?page=" + (currentPage - 1)} />
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
                        href={"?page=" + item}
                        isActive={item === currentPage}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={"?page=" + (currentPage + 1)} />
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
