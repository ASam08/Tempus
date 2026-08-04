import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchFilters from "@/components/ui/dashboard/admin/searchfilters";

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock(
  "@/components/ui/checkbox",
  () => require("@/testing/mocks/shadcn").checkboxMock,
);

const defaultProps = {
  label: "Admin Role",
  field: "role",
  value: "admin",
  operator: "eq",
  currentFilter: "role--admin--eq",
};

const inactiveProps = {
  ...defaultProps,
  currentFilter: "role--user--eq",
};

describe("SearchFilters", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
  });

  describe("rendering", () => {
    it("renders the label text", () => {
      render(<SearchFilters {...defaultProps} />);
      expect(screen.getByText("Admin Role")).toBeInTheDocument();
    });

    it("renders a checkbox", () => {
      render(<SearchFilters {...defaultProps} />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("checkbox is checked when filter is active", () => {
      render(<SearchFilters {...defaultProps} />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("checkbox is unchecked when filter is inactive", () => {
      render(<SearchFilters {...inactiveProps} />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("click behaviour", () => {
    it("calls router.push on click", async () => {
      const user = userEvent.setup();
      render(<SearchFilters {...defaultProps} />);
      await user.click(screen.getByRole("checkbox"));
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it("resets page to 1 on click", async () => {
      const user = userEvent.setup();
      render(<SearchFilters {...defaultProps} />);
      await user.click(screen.getByRole("checkbox"));
      expect(mockPush.mock.calls[0][0]).toContain("page=1");
    });

    it("preserves existing unrelated search params on click", async () => {
      const user = userEvent.setup();
      mockSearchParams.set("search", "alice");
      render(<SearchFilters {...defaultProps} />);
      await user.click(screen.getByRole("checkbox"));
      expect(mockPush.mock.calls[0][0]).toContain("search=alice");
    });

    it("removes filter params from URL when deactivating an active filter", async () => {
      const user = userEvent.setup();
      render(<SearchFilters {...defaultProps} />);
      await user.click(screen.getByRole("checkbox"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).not.toContain("filterField");
      expect(url).not.toContain("filterValue");
      expect(url).not.toContain("filterOperator");
    });

    it("sets filter params in URL when activating an inactive filter", async () => {
      const user = userEvent.setup();
      render(<SearchFilters {...inactiveProps} />);
      await user.click(screen.getByRole("checkbox"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("filterField=role");
      expect(url).toContain("filterValue=admin");
      expect(url).toContain("filterOperator=eq");
    });

    it("overwrites existing filter params when activating a new filter", async () => {
      const user = userEvent.setup();
      mockSearchParams.set("filterField", "role");
      mockSearchParams.set("filterValue", "user");
      mockSearchParams.set("filterOperator", "eq");
      render(<SearchFilters {...inactiveProps} />);
      await user.click(screen.getByRole("checkbox"));
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toContain("filterValue=admin");
      expect(url).not.toContain("filterValue=user");
    });
  });
});
