import { render, screen } from "@testing-library/react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPaginationItems } from "@/lib/utils";
import { getAllTimetableSets } from "@/lib/data";
import ManageTimetablesPage from "@/app/dashboard/timetable/manage/page";

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("redirect");
  }),
}));

jest.mock("@/lib/utils", () => ({
  getPaginationItems: jest.fn(),
}));

jest.mock("@/lib/data", () => ({
  getAllTimetableSets: jest.fn(),
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
  default: ({ field, label, currentSortBy, currentSortDirection }: any) => (
    <div
      data-testid="sortable-header"
      data-field={field}
      data-sortby={currentSortBy}
      data-sortdirection={currentSortDirection}
    >
      {label}
    </div>
  ),
}));

jest.mock("@/app/ui/timetable/setmanageactions", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="set-manage-actions">{props.id}</div>
  ),
}));

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock("lucide-react", () => ({
  LucidePlus: () => <svg data-testid="plus-icon" />,
}));

describe("ManageTimetablesPage", () => {
  const renderPage = (searchParams: Record<string, string> = {}) =>
    ManageTimetablesPage({ searchParams: Promise.resolve(searchParams) });

  const buildTimetables = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `set-${i}`,
      title: `Timetable ${i}`,
      description: `Description ${i}`,
    }));

  beforeEach(() => {
    jest.clearAllMocks();
    (redirect as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("redirect");
    });
    (headers as unknown as jest.Mock).mockResolvedValue({});
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: "user-1" },
    });
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue([]);
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1]);
  });

  it("redirects to login when there is no session", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=/dashboard/timetable/manage",
    );
  });

  it("fetches timetables for the session user", async () => {
    await renderPage();

    expect(getAllTimetableSets).toHaveBeenCalledWith("user-1");
  });

  it("renders a row for each timetable with title, description, and actions", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue([
      { id: "1", title: "Math", description: "Algebra class" },
      { id: "2", title: "Science", description: "Physics class" },
    ]);

    render(await renderPage());

    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("Algebra class")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.getByText("Physics class")).toBeInTheDocument();

    const actions = screen.getAllByTestId("set-manage-actions");
    expect(actions).toHaveLength(2);
    expect(actions[0]).toHaveTextContent("1");
    expect(actions[1]).toHaveTextContent("2");
  });

  it("renders no rows when there are no timetables", async () => {
    render(await renderPage());

    expect(screen.queryByTestId("set-manage-actions")).not.toBeInTheDocument();
    expect(screen.getByText("0 total timetables")).toBeInTheDocument();
  });

  it("renders the create-new-timetable link with both responsive buttons", async () => {
    render(await renderPage());

    const link = screen.getByRole("link", { name: /create new/i });
    expect(link).toHaveAttribute("href", "/dashboard/timetable/new-timetable");
    expect(screen.getAllByTestId("plus-icon")).toHaveLength(2);
  });

  it("renders the back-to-timetables link", async () => {
    render(await renderPage());

    expect(
      screen.getByRole("link", { name: "Back to Timetables" }),
    ).toHaveAttribute("href", "/dashboard/timetable");
  });

  it("defaults sort field and direction when no search params are provided", async () => {
    render(await renderPage());

    const header = screen.getByTestId("sortable-header");
    expect(header).toHaveAttribute("data-sortby", "title");
    expect(header).toHaveAttribute("data-sortdirection", "asc");
  });

  it("accepts a valid sortBy value", async () => {
    render(await renderPage({ sortBy: "title" }));

    expect(screen.getByTestId("sortable-header")).toHaveAttribute(
      "data-sortby",
      "title",
    );
  });

  it("falls back to title when sortBy is not a valid field", async () => {
    render(await renderPage({ sortBy: "invalid" }));

    expect(screen.getByTestId("sortable-header")).toHaveAttribute(
      "data-sortby",
      "title",
    );
  });

  it("resolves sortDirection to desc when explicitly requested", async () => {
    render(await renderPage({ sortDirection: "desc" }));

    expect(screen.getByTestId("sortable-header")).toHaveAttribute(
      "data-sortdirection",
      "desc",
    );
  });

  it("resolves sortDirection to asc for any non-desc value", async () => {
    render(await renderPage({ sortDirection: "sideways" }));

    expect(screen.getByTestId("sortable-header")).toHaveAttribute(
      "data-sortdirection",
      "asc",
    );
  });

  it("defaults to page 1 when the page param is missing", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(15),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1, 2]);

    render(await renderPage());

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("defaults to page 1 when the page param is not a number", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(15),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1, 2]);

    render(await renderPage({ page: "not-a-number" }));

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("uses the provided page param", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(15),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1, 2]);

    render(await renderPage({ page: "2" }));

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("hides pagination controls when there is only one page", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(5),
    );

    render(await renderPage());

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("hides pagination controls when there are no timetables", async () => {
    render(await renderPage());

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows pagination controls when there is more than one page", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(15),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1, 2]);

    render(await renderPage());

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("hides the previous link on the first page and shows the next link", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(15),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1, 2]);

    render(await renderPage({ page: "1" }));

    expect(
      screen.queryByRole("link", { name: "Previous" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "?page=2",
    );
  });

  it("shows the previous link and hides the next link on the last page", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(15),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1, 2]);

    render(await renderPage({ page: "2" }));

    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "?page=1",
    );
    expect(
      screen.queryByRole("link", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("renders an ellipsis item returned by getPaginationItems", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(25),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([
      1,
      "ellipsis",
      3,
    ]);

    render(await renderPage({ page: "1" }));

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "3" })).toBeInTheDocument();
  });

  it("marks the current page link as active", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(25),
    );
    (getPaginationItems as unknown as jest.Mock).mockReturnValue([1, 2, 3]);

    render(await renderPage({ page: "2" }));

    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "3" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows the total timetable count", async () => {
    (getAllTimetableSets as unknown as jest.Mock).mockResolvedValue(
      buildTimetables(3),
    );

    render(await renderPage());

    expect(screen.getByText("3 total timetables")).toBeInTheDocument();
  });
});
