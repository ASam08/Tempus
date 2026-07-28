import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@/components/ui/avatar",
  () => require("@/testing/mocks/shadcn").avatarMock,
);

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock(
  "@/components/ui/dropdown-menu",
  () => require("@/testing/mocks/shadcn").dropdownMenuMock,
);

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  LucideLogOut: () => <div>LucideLogOut</div>,
  LucideUser2: () => <div>LucideUser2</div>,
  LucideSettings: () => <div>LucideSettings</div>,
  LucideUsers: () => <div>LucideUsers</div>,
}));

jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import { AvatarDropdown } from "@/app/ui/avatarmenu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const mockUseSession = authClient.useSession as unknown as jest.Mock;
const mockSignOut = authClient.signOut as unknown as jest.Mock;
const mockUseRouter = useRouter as unknown as jest.Mock;
const mockPush = jest.fn();

describe("AvatarDropdown Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it("renders nothing when there is no session data", () => {
    mockUseSession.mockReturnValue({ data: null });
    const { container } = render(<AvatarDropdown />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the session has no user", () => {
    mockUseSession.mockReturnValue({ data: {} });
    const { container } = render(<AvatarDropdown />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders initials from a multi-word name", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    render(<AvatarDropdown />);
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("JS");
  });

  it("renders repeated initials from a single-word name", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Madonna", role: "user" } },
    });
    render(<AvatarDropdown />);
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("MM");
  });

  it("falls back to 'User' initials when the name is missing", () => {
    mockUseSession.mockReturnValue({ data: { user: { role: "user" } } });
    render(<AvatarDropdown />);
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("U");
  });

  it("shows the user's formatted name in the dropdown label", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    render(<AvatarDropdown />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("JANE SMITH")).toBeInTheDocument();
  });

  it("renders Account and Settings links but no Admin link for a non-admin user", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    render(<AvatarDropdown />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: /account/i })).toHaveAttribute(
      "href",
      "/dashboard/account",
    );
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute(
      "href",
      "/dashboard/settings",
    );
    expect(
      screen.queryByRole("link", { name: /admin/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an Admin link when the user has the admin role", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Jane Smith", role: "admin" } },
    });
    render(<AvatarDropdown />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/dashboard/admin",
    );
  });

  it("signs out and pushes to /login when Sign out is clicked", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    mockSignOut.mockResolvedValue(undefined);

    render(<AvatarDropdown />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
