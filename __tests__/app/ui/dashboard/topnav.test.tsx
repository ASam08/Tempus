import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
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

import { AvatarDropdown } from "@/app/ui/avatarmenu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

describe("AvatarDropdown Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it("renders nothing when there is no session data", () => {
    (authClient.useSession as jest.Mock).mockReturnValue({ data: null });
    const { container } = render(<AvatarDropdown />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the session has no user", () => {
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: null },
    });
    const { container } = render(<AvatarDropdown />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders initials from a full first and last name", () => {
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    const { getByText } = render(<AvatarDropdown />);
    expect(getByText("JS")).toBeInTheDocument();
  });

  it("renders duplicated initials when the user has a single name", () => {
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Madonna", role: "user" } },
    });
    const { getByText } = render(<AvatarDropdown />);
    expect(getByText("MM")).toBeInTheDocument();
  });

  it("falls back to a 'User' initial when the user has no name", () => {
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: undefined, role: "user" } },
    });
    const { getByText } = render(<AvatarDropdown />);
    expect(getByText("U")).toBeInTheDocument();
  });

  it("opens the menu and shows Account and Settings links but no Admin link for a non-admin user", async () => {
    const user = userEvent.setup();
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    const { getByRole, queryByText, getByText } = render(<AvatarDropdown />);

    await user.click(getByRole("button"));

    expect(
      getByText((_, element) => element?.textContent === "JANE SMITH"),
    ).toBeInTheDocument();
    expect(getByRole("menuitem", { name: /account/i })).toBeInTheDocument();
    expect(getByRole("menuitem", { name: /settings/i })).toBeInTheDocument();
    expect(queryByText(/admin/i)).not.toBeInTheDocument();
  });

  it("shows the Admin link when the user has the admin role", async () => {
    const user = userEvent.setup();
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Jane Smith", role: "admin" } },
    });
    const { getByRole } = render(<AvatarDropdown />);

    await user.click(getByRole("button"));

    expect(getByRole("menuitem", { name: /admin/i })).toBeInTheDocument();
  });

  it("links Account and Settings menu items to the correct destinations", async () => {
    const user = userEvent.setup();
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    const { getByRole } = render(<AvatarDropdown />);

    await user.click(getByRole("button"));

    expect(
      getByRole("menuitem", { name: /account/i }).closest("a"),
    ).toHaveAttribute("href", "/dashboard/account");
    expect(
      getByRole("menuitem", { name: /settings/i }).closest("a"),
    ).toHaveAttribute("href", "/dashboard/settings");
  });

  it("links the Admin menu item to the admin dashboard", async () => {
    const user = userEvent.setup();
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Jane Smith", role: "admin" } },
    });
    const { getByRole } = render(<AvatarDropdown />);

    await user.click(getByRole("button"));

    expect(
      getByRole("menuitem", { name: /admin/i }).closest("a"),
    ).toHaveAttribute("href", "/dashboard/admin");
  });

  it("signs the user out and redirects to /login when Sign out is clicked", async () => {
    const user = userEvent.setup();
    (authClient.useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Jane Smith", role: "user" } },
    });
    (authClient.signOut as jest.Mock).mockResolvedValue(undefined);
    const { getByRole } = render(<AvatarDropdown />);

    await user.click(getByRole("button"));
    await user.click(getByRole("menuitem", { name: /sign out/i }));

    expect(authClient.signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
