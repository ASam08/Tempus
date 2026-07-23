import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarDropdown } from "@/app/ui/avatarmenu";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
      signOut: jest.fn(),
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

jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock(
  "@/components/ui/dropdown-menu",
  () => require("@/testing/mocks/shadcn").dropdownMenuMock,
);

jest.mock(
  "@/components/ui/avatar",
  () => require("@/testing/mocks/shadcn").avatarMock,
);

jest.mock("lucide-react", () => ({
  LucideLogOut: () => <div>LucideLogOut</div>,
  LucideUser2: () => <div>LucideUser2</div>,
  LucideSettings: () => <div>LucideSettings</div>,
  LucideUsers: () => <div>LucideUsers</div>,
}));

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockSignOut = auth.api.signOut as unknown as jest.Mock;
const mockHeaders = headers as unknown as jest.Mock;
const mockRedirect = redirect as unknown as jest.Mock;

describe("AvatarDropdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirect.mockImplementation(() => {
      throw new Error("redirect");
    });
    mockHeaders.mockResolvedValue(new Headers());
  });

  it("returns null when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const jsx = await AvatarDropdown();
    expect(jsx).toBeNull();
  });

  it("returns null when the session has no user", async () => {
    mockGetSession.mockResolvedValue({});
    const jsx = await AvatarDropdown();
    expect(jsx).toBeNull();
  });

  it("renders initials from a multi-word name", async () => {
    mockGetSession.mockResolvedValue({
      user: { name: "John Smith", role: "user" },
    });
    render(await AvatarDropdown());
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("JS");
  });

  it("renders repeated initials from a single-word name", async () => {
    mockGetSession.mockResolvedValue({
      user: { name: "Madonna", role: "user" },
    });
    render(await AvatarDropdown());
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("MM");
  });

  it("falls back to 'User' initials when the name is missing", async () => {
    mockGetSession.mockResolvedValue({ user: { role: "user" } });
    render(await AvatarDropdown());
    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("U");
  });

  it("shows the user's formatted name in the dropdown label", async () => {
    mockGetSession.mockResolvedValue({
      user: { name: "John Smith", role: "user" },
    });
    render(await AvatarDropdown());
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("JOHN SMITH")).toBeInTheDocument();
  });

  it("renders Account and Settings links but no Admin link for a non-admin user", async () => {
    mockGetSession.mockResolvedValue({
      user: { name: "John Smith", role: "user" },
    });
    render(await AvatarDropdown());
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
    mockGetSession.mockResolvedValue({
      user: { name: "John Smith", role: "admin" },
    });
    render(await AvatarDropdown());
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/dashboard/admin",
    );
  });

  it("signs out with the request headers and redirects to /login when Sign out is clicked", async () => {
    mockGetSession.mockResolvedValue({
      user: { name: "John Smith", role: "user" },
    });
    mockSignOut.mockResolvedValue(undefined);
    mockRedirect.mockImplementation(() => {});
    const signOutHeaders = new Headers();
    mockHeaders.mockResolvedValue(signOutHeaders);

    render(await AvatarDropdown());
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ headers: signOutHeaders });
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
