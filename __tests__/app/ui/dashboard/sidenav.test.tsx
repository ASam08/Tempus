import "@testing-library/jest-dom";
import { act, render } from "@testing-library/react";

jest.mock("@/components/branding/tempuslogo", () => ({
  __esModule: true,
  default: () => <div>TempusLogo</div>,
}));

jest.mock("@/components/branding/tempuslogobrand", () => ({
  __esModule: true,
  default: () => <div>TempusLogoBrand</div>,
}));

jest.mock("lucide-react", () => ({
  LucideGrid: () => <div>LucideGrid</div>,
  LucideHome: () => <div>LucideHome</div>,
  LucideLogOut: () => <div>LucideLogOut</div>,
  LucideSettings: () => <div>LucideSettings</div>,
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
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

import SideNav from "@/app/ui/dashboard/sidenav";
import { redirect } from "next/navigation";

describe("SideNav Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (redirect as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("redirect");
    });
  });

  it("renders navigation links correctly", () => {
    const { getByText } = render(<SideNav />);
    expect(getByText("Home")).toBeInTheDocument();
    expect(getByText("Timetable")).toBeInTheDocument();
    expect(getByText("Settings")).toBeInTheDocument();
  });

  it("renders TempusLogo and TempusLogoBrand", () => {
    const { getByText } = render(<SideNav />);
    expect(getByText("TempusLogo")).toBeInTheDocument();
    expect(getByText("TempusLogoBrand")).toBeInTheDocument();
  });

  it("renders icons correctly", () => {
    const { getByText } = render(<SideNav />);
    expect(getByText("LucideHome")).toBeInTheDocument();
    expect(getByText("LucideGrid")).toBeInTheDocument();
    expect(getByText("LucideSettings")).toBeInTheDocument();
  });

  it("renders logout button correctly", () => {
    const { getByText } = render(<SideNav />);
    expect(getByText("LucideLogOut")).toBeInTheDocument();
    expect(getByText("Sign Out")).toBeInTheDocument();
  });

  it("links point to correct destinations", () => {
    const { getByRole } = render(<SideNav />);
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

  it("calls signOut with headers and redirects to /login when form is submitted", async () => {
    const { auth } = require("@/lib/auth");
    const { headers } = require("next/headers");
    const mockHeaders = new Headers();
    (headers as jest.Mock).mockResolvedValue(mockHeaders);
    (redirect as unknown as jest.Mock).mockImplementation(() => {});

    const { getByRole } = render(<SideNav />);

    await act(async () => {
      getByRole("button").click();
    });

    expect(auth.api.signOut).toHaveBeenCalledWith({ headers: mockHeaders });
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
