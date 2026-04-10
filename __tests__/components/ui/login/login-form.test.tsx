import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/lib/actions", () => ({
  authenticate: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));

// Mock useActionState so we can control what it returns
const mockFormAction = jest.fn();
let mockErrorMessage: string | undefined = undefined;
let mockIsPending = false;

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(() => [
    mockErrorMessage,
    mockFormAction,
    mockIsPending,
  ]),
}));

import { LoginForm } from "@/components/ui/login/login-form";

beforeEach(() => {
  jest.clearAllMocks();
  mockErrorMessage = undefined;
  mockIsPending = false;
});

describe("LoginForm", () => {
  describe("Form fields", () => {
    it("renders the email input", () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("renders the password input", () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders the login button", () => {
      render(<LoginForm />);
      expect(
        screen.getByRole("button", { name: /login/i }),
      ).toBeInTheDocument();
    });

    it("renders a link to sign up", () => {
      render(<LoginForm />);
      expect(
        screen.getByRole("link", { name: /sign up/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("shows inline error message when authentication fails", () => {
      mockErrorMessage = "Invalid credentials";
      render(<LoginForm />);
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    it("does not show error message when there is no error", () => {
      mockErrorMessage = undefined;
      render(<LoginForm />);
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  describe("Pending state", () => {
    it("disables the login button while pending", () => {
      mockIsPending = true;
      render(<LoginForm />);
      const button = screen.getByRole("button", { name: /login/i });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Callback URL", () => {
    it("defaults to /dashboard when no callbackUrl is provided", () => {
      render(<LoginForm />);
      const hiddenInput = document.querySelector('input[name="redirectTo"]');
      expect(hiddenInput).toHaveValue("/dashboard");
    });

    it("uses the callbackUrl from search params when provided", () => {
      const { useSearchParams } = require("next/navigation");
      useSearchParams.mockReturnValue({ get: jest.fn(() => "/timetable") });
      render(<LoginForm />);
      const hiddenInput = document.querySelector('input[name="redirectTo"]');
      expect(hiddenInput).toHaveValue("/timetable");
    });
  });
});
