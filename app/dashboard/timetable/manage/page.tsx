import { auth } from "@/lib/auth";
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
import SortableHeader from "@/components/ui/dashboard/admin/sortableheader";
import { getAllTimetableSets } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SetManageActions from "@/app/ui/timetable/setmanageactions";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/timetable/manage");
  }

  const userId = session.user.id;

  const { page, sortBy, sortDirection } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;

  const validSortFields = ["title"] as const;
  type SortField = (typeof validSortFields)[number];

  const resolvedSortBy: SortField = validSortFields.includes(
    sortBy as SortField,
  )
    ? (sortBy as SortField)
    : "title";
  const resolvedSortDirection = sortDirection === "desc" ? "desc" : "asc";

  const timetables = await getAllTimetableSets(userId);

  const totalTimetables = timetables.length;
  const totalPages = Math.ceil(totalTimetables / pageSize);

  return (
    <div className="flex h-full max-w-screen flex-col px-3 py-4 md:px-2">
      <h1 className="mb-4 flex flex-wrap text-xl font-bold text-gray-800 md:text-2xl dark:text-gray-200">
        Manage Timetables
      </h1>
      <div>
        <div className="overflow-auto rounded-xl border border-stone-300 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-stone-50 px-4 py-3 dark:bg-gray-950">
                  <SortableHeader
                    field="title"
                    label="Name"
                    currentSortBy={resolvedSortBy}
                    currentSortDirection={resolvedSortDirection}
                  />
                </TableHead>
                <TableHead className="px-4 py-3">Description</TableHead>
                <TableHead className="px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timetables.map((timetable: any) => (
                <TableRow
                  key={timetable.id}
                  className="border-t border-stone-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                >
                  <TableCell className="sticky left-0 z-10 bg-white px-4 py-3 dark:bg-gray-900">
                    {timetable.title}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {timetable.description}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <SetManageActions {...timetable} />
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
        <div className="mt-4 flex flex-col items-center justify-between gap-4 md:flex-row">
          <Button variant="outline" asChild>
            <Link href="/dashboard/timetable">Back to Timetables</Link>
          </Button>
          <div className="text-right text-sm">
            {totalTimetables} total timetables
          </div>
        </div>
      </div>
    </div>
  );
}
