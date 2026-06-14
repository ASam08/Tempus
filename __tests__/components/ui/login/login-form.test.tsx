import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
    },
  },
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));

import { LoginForm } from "@/components/ui/login/login-form";

import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockSignInEmail = authClient.signIn.email as jest.Mock;
const mockToastError = toast.error as jest.Mock;

async function fillAndSubmit(email = "user@example.com", password = "secret") {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole("button", { name: /login/i }));
}

function getMockPush(): jest.Mock {
  return mockUseRouter.mock.results.at(-1)?.value?.push;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: jest.fn() });
  mockUseSearchParams.mockReturnValue({ get: jest.fn(() => null) });
  mockSignInEmail.mockResolvedValue({ error: null });
});

describe("LoginForm", () => {
  describe("Form fields", () => {
    it("renders the email input", () => {
      render(<LoginForm emailDisabled={false} />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("renders the password input", () => {
      render(<LoginForm emailDisabled={false} />);
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders the login button", () => {
      render(<LoginForm emailDisabled={false} />);
      expect(
        screen.getByRole("button", { name: /login/i }),
      ).toBeInTheDocument();
    });

    it("renders a link to sign up", () => {
      render(<LoginForm emailDisabled={false} />);
      expect(
        screen.getByRole("link", { name: /sign up/i }),
      ).toBeInTheDocument();
    });

    it("renders terms of service and privacy policy links", () => {
      render(<LoginForm emailDisabled={false} />);
      expect(
        screen.getByRole("link", { name: /terms of service/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /privacy policy/i }),
      ).toBeInTheDocument();
    });

    it("does not show an error message on initial render", () => {
      render(<LoginForm emailDisabled={false} />);
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeEmptyDOMElement();
    });

    it("shows the forgot password link when emailDisabled is false", () => {
      render(<LoginForm emailDisabled={false} />);
      expect(
        screen.getByRole("link", { name: /forgot password/i }),
      ).toBeInTheDocument();
    });

    it("does not show the forgot password link when emailDisabled is true", () => {
      render(<LoginForm emailDisabled={true} />);
      expect(
        screen.queryByRole("link", { name: /forgot password/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Pending state", () => {
    it("shows 'Logging in…' and disables the button while the request is in flight", async () => {
      mockSignInEmail.mockReturnValue(new Promise(() => {}));

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      const button = screen.getByRole("button", { name: /logging in/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Successful login", () => {
    it("calls authClient.signIn.email with the submitted credentials", async () => {
      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit("user@example.com", "mypassword");

      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalledWith({
          email: "user@example.com",
          password: "mypassword",
          callbackURL: "/dashboard",
        });
      });
    });

    it("redirects to /dashboard (default) after a successful login", async () => {
      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(getMockPush()).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("does not show an error message after a successful login", async () => {
      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(
          screen.queryByRole("img", { hidden: true }),
        ).not.toBeInTheDocument();
      });
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });

  describe("Callback URL", () => {
    it("defaults to /dashboard when no callbackUrl param is present", async () => {
      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalledWith(
          expect.objectContaining({ callbackURL: "/dashboard" }),
        );
      });
    });

    it("passes the callbackUrl from search params to signIn", async () => {
      mockUseSearchParams.mockReturnValue({ get: jest.fn(() => "/timetable") });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(mockSignInEmail).toHaveBeenCalledWith(
          expect.objectContaining({ callbackURL: "/timetable" }),
        );
        expect(getMockPush()).toHaveBeenCalledWith("/timetable");
      });
    });
  });

  describe("Error handling", () => {
    it("shows the banned-user message when error code is BANNED_USER", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "BANNED_USER" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(
          screen.getByText(/your account has not been approved yet/i),
        ).toBeInTheDocument();
      });
    });

    it("fires toast.error for the banned-user message", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "BANNED_USER" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringMatching(/your account has not been approved yet/i),
          expect.objectContaining({ position: "top-center" }),
        );
      });
    });

    it("shows 'Invalid credentials' when error code is INVALID_EMAIL_OR_PASSWORD", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "INVALID_EMAIL_OR_PASSWORD" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it("fires toast.error for the invalid-credentials message", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "INVALID_EMAIL_OR_PASSWORD" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringMatching(/invalid credentials/i),
          expect.objectContaining({ position: "top-center" }),
        );
      });
    });

    it("shows a generic error message for unknown error codes", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "SOME_UNKNOWN_CODE" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it("calls console.log with the error details for unknown error codes", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const unknownError = { code: "SOME_UNKNOWN_CODE" };
      mockSignInEmail.mockResolvedValue({ error: unknownError });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("auth error:", unknownError);
      });

      consoleSpy.mockRestore();
    });

    it("fires toast.error for the generic error message", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "SOME_UNKNOWN_CODE" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringMatching(/something went wrong/i),
          expect.objectContaining({ position: "top-center" }),
        );
      });
    });

    it("re-enables the login button after an error", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "INVALID_EMAIL_OR_PASSWORD" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /login/i });
        expect(button).not.toBeDisabled();
        expect(button).toHaveAttribute("aria-disabled", "false");
      });
    });

    it("does not redirect when sign-in returns an error", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "INVALID_EMAIL_OR_PASSWORD" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
      expect(getMockPush()).not.toHaveBeenCalled();
    });

    it("includes the support description in every toast.error call", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { code: "BANNED_USER" },
      });

      render(<LoginForm emailDisabled={false} />);
      await fillAndSubmit();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            description: expect.stringMatching(/contact an administrator/i),
          }),
        );
      });
    });
  });
});
