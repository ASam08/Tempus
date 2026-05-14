import { render, screen, fireEvent } from "@testing-library/react";
import SortableHeader from "@/components/ui/dashboard/admin/sortableheader";

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronUp: ({ className }: { className: string }) => (
    <svg data-testid="icon-chevron-up" className={className} />
  ),
  ChevronDown: ({ className }: { className: string }) => (
    <svg data-testid="icon-chevron-down" className={className} />
  ),
  ChevronsUpDown: ({ className }: { className: string }) => (
    <svg data-testid="icon-chevrons-updown" className={className} />
  ),
}));

const defaultProps = {
  field: "name",
  label: "Name",
  currentSortBy: "name",
  currentSortDirection: "asc" as const,
};

describe("SortableHeader", () => {
  beforeEach(() => {
    mockPush.mockClear();
    // Reset search params before each test
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
  });

  describe("rendering", () => {
    it("renders the label text", () => {
      render(<SortableHeader {...defaultProps} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("renders as a button", () => {
      render(<SortableHeader {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("shows ChevronUp when active and sort direction is asc", () => {
      render(
        <SortableHeader
          {...defaultProps}
          currentSortBy="name"
          currentSortDirection="asc"
        />,
      );
      expect(screen.getByTestId("icon-chevron-up")).toBeInTheDocument();
    });

    it("shows ChevronDown when active and sort direction is desc", () => {
      render(
        <SortableHeader
          {...defaultProps}
          currentSortBy="name"
          currentSortDirection="desc"
        />,
      );
      expect(screen.getByTestId("icon-chevron-down")).toBeInTheDocument();
    });

    it("shows ChevronsUpDown when field is not the active sort", () => {
      render(
        <SortableHeader
          {...defaultProps}
          currentSortBy="email"
          currentSortDirection="asc"
        />,
      );
      expect(screen.getByTestId("icon-chevrons-updown")).toBeInTheDocument();
    });
  });

  describe("click behaviour", () => {
    it("calls router.push on click", () => {
      render(<SortableHeader {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it("sets sortBy to the field value in the URL", () => {
      render(
        <SortableHeader
          {...defaultProps}
          field="email"
          currentSortBy="name"
          currentSortDirection="asc"
        />,
      );
      fireEvent.click(screen.getByRole("button"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("sortBy=email");
    });

    it("resets page to 1 on click", () => {
      render(<SortableHeader {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("page=1");
    });

    it("toggles asc → desc when clicking the active field sorted asc", () => {
      render(
        <SortableHeader
          {...defaultProps}
          currentSortBy="name"
          currentSortDirection="asc"
        />,
      );
      fireEvent.click(screen.getByRole("button"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("sortDirection=desc");
    });

    it("toggles desc → asc when clicking the active field sorted desc", () => {
      render(
        <SortableHeader
          {...defaultProps}
          currentSortBy="name"
          currentSortDirection="desc"
        />,
      );
      fireEvent.click(screen.getByRole("button"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("sortDirection=asc");
    });

    it("defaults to asc when clicking an inactive field", () => {
      render(
        <SortableHeader
          {...defaultProps}
          currentSortBy="email"
          currentSortDirection="desc"
        />,
      );
      fireEvent.click(screen.getByRole("button"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("sortDirection=asc");
    });

    it("preserves existing search params on click", () => {
      mockSearchParams.set("filter", "active");
      render(<SortableHeader {...defaultProps} />);
      fireEvent.click(screen.getByRole("button"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("filter=active");
    });
  });
});
