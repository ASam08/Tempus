import { render, screen } from "@testing-library/react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AccountPage from "@/app/dashboard/account/page";

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

jest.mock("@/app/ui/account/accountform", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="account-form" />),
}));

describe("AccountPage", () => {
  const mockHeaders = { get: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (redirect as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("redirect");
    });
    (headers as unknown as jest.Mock).mockResolvedValue(mockHeaders);
  });

  it("renders the account form when a session exists", async () => {
    const mockUser = { id: "user-1", name: "Sam" };
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    const jsx = await AccountPage();
    render(jsx);

    expect(auth.api.getSession).toHaveBeenCalledWith({
      headers: mockHeaders,
    });
    expect(
      screen.getByRole("heading", { name: "Account" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("account-form")).toBeInTheDocument();

    const AccountForm = require("@/app/ui/account/accountform").default;
    expect(AccountForm).toHaveBeenCalledWith({ user: mockUser }, undefined);
  });

  it("redirects to login when there is no session user id", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue(null);

    await expect(AccountPage()).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when the session has no user", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: undefined,
    });

    await expect(AccountPage()).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when the session user has no id", async () => {
    (auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
      user: { id: undefined },
    });

    await expect(AccountPage()).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
