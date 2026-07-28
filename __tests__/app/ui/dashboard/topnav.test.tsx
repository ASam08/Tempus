import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

jest.mock("@/components/branding/tempuslogo", () => ({
  __esModule: true,
  default: () => <div>TempusLogo</div>,
}));

jest.mock("@/components/branding/tempuslogobrand", () => ({
  __esModule: true,
  default: () => <div>TempusLogoBrand</div>,
}));

jest.mock("@/app/ui/avatarmenu", () => ({
  __esModule: true,
  AvatarDropdown: () => <div>AvatarDropdown</div>,
}));

jest.mock("lucide-react", () => ({
  LucideGrid: () => <div>LucideGrid</div>,
  LucideHome: () => <div>LucideHome</div>,
  LucideSettings: () => <div>LucideSettings</div>,
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("next/link", () => {
  return ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

import TopNav from "@/app/ui/dashboard/topnav";
import { usePathname } from "next/navigation";

describe("TopNav Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
  });

  it("renders navigation links correctly", () => {
    const { getByText } = render(<TopNav />);
    expect(getByText("Home")).toBeInTheDocument();
    expect(getByText("Timetable")).toBeInTheDocument();
    expect(getByText("Settings")).toBeInTheDocument();
  });

  it("renders TempusLogo and TempusLogoBrand", () => {
    const { getByText } = render(<TopNav />);
    expect(getByText("TempusLogo")).toBeInTheDocument();
    expect(getByText("TempusLogoBrand")).toBeInTheDocument();
  });

  it("renders icons correctly", () => {
    const { getByText } = render(<TopNav />);
    expect(getByText("LucideHome")).toBeInTheDocument();
    expect(getByText("LucideGrid")).toBeInTheDocument();
    expect(getByText("LucideSettings")).toBeInTheDocument();
  });

  it("renders the AvatarDropdown", () => {
    const { getByText } = render(<TopNav />);
    expect(getByText("AvatarDropdown")).toBeInTheDocument();
  });

  it("links point to correct destinations", () => {
    const { getByRole } = render(<TopNav />);
    expect(getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(getByRole("link", { name: /timetable/i })).toHaveAttribute(
      "href",
      "/dashboard/timetable",
    );
    expect(getByRole("link", { name: /settings/i })).toHaveAttribute(
      "href",
      "/dashboard/settings",
    );
  });

  it("marks the active link with aria-current and active styling", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard/timetable");
    const { getByRole } = render(<TopNav />);

    const activeLink = getByRole("link", { name: /timetable/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveClass(
      "text-blue-600",
      "underline",
      "decoration-2",
      "underline-offset-4",
    );

    const inactiveLink = getByRole("link", { name: /home/i });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
    expect(inactiveLink).toHaveClass("text-primary");
  });

  it("does not mark any link active when pathname matches none", () => {
    (usePathname as jest.Mock).mockReturnValue("/other-page");
    const { getByRole } = render(<TopNav />);

    expect(getByRole("link", { name: /home/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(getByRole("link", { name: /timetable/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(getByRole("link", { name: /settings/i })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
