import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: jest.fn(),
    },
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/general/password-requirements-hover", () => ({
  PasswordRequirementsHover: () => null,
}));

import { SignupForm } from "@/components/ui/signup/signup-form";
import { authClient } from "@/lib/auth-client";

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockReset();
  (authClient.signUp.email as jest.Mock).mockResolvedValue({ error: null });
});

const validFormData = {
  name: "John Doe",
  email: "john@example.com",
  password: "Password1!",
  confirmPassword: "Password1!",
};

// Uses fireEvent throughout so that JSDOM's native constraint validation
// (required, type="email") does not cancel the submit event before
// handleSubmit runs. This lets the component's own Zod validation execute.
function fillAndSubmit(overrides: Partial<typeof validFormData> = {}) {
  const data = { ...validFormData, ...overrides };

  fireEvent.change(screen.getByLabelText(/^name$/i), {
    target: { value: data.name },
  });
  fireEvent.change(screen.getByLabelText(/^email$/i), {
    target: { value: data.email },
  });
  fireEvent.change(document.getElementById("password")!, {
    target: { value: data.password },
  });
  fireEvent.change(document.getElementById("confirmPassword")!, {
    target: { value: data.confirmPassword },
  });
  fireEvent.submit(document.querySelector("form")!);
}

describe("SignupForm", () => {
  describe("Form fields", () => {
    it("renders the name input", () => {
      render(<SignupForm />);
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    });

    it("renders the email input", () => {
      render(<SignupForm />);
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    });

    it("renders the password input", () => {
      render(<SignupForm />);
      expect(document.getElementById("password")).toBeInTheDocument();
    });

    it("renders the confirm password input", () => {
      render(<SignupForm />);
      expect(document.getElementById("confirmPassword")).toBeInTheDocument();
    });

    it("renders the create account button", () => {
      render(<SignupForm />);
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });

    it("renders a link to sign in", () => {
      render(<SignupForm />);
      expect(
        screen.getByRole("link", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    it("renders terms of service and privacy policy links", () => {
      render(<SignupForm />);
      expect(
        screen.getByRole("link", { name: /terms of service/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /privacy policy/i }),
      ).toBeInTheDocument();
    });

    it("applies custom className to the wrapper alongside default classes", () => {
      const { container } = render(<SignupForm className="custom-class" />);
      expect(container.firstChild).toHaveClass("custom-class");
      expect(container.firstChild).toHaveClass("flex");
    });

    it("does not show any error messages on initial render", () => {
      render(<SignupForm />);
      expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Invalid email address"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/passwords do not match/i),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Password must:")).not.toBeInTheDocument();
    });
  });

  describe("Client-side validation", () => {
    it("shows name required error when name is empty", async () => {
      render(<SignupForm />);
      fillAndSubmit({ name: "" });

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
      });
      expect(authClient.signUp.email).not.toHaveBeenCalled();
    });

    it("shows invalid email error when email is malformed", async () => {
      render(<SignupForm />);
      fillAndSubmit({ email: "not-an-email" });

      await waitFor(() => {
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      });
      expect(authClient.signUp.email).not.toHaveBeenCalled();
    });

    it("shows password length error when password is too short", async () => {
      render(<SignupForm />);
      fillAndSubmit({ password: "Ab1!", confirmPassword: "Ab1!" });

      await waitFor(() => {
        expect(screen.getByText("Password must:")).toBeInTheDocument();
        // The phrase also appears in the static FieldDescription hint below the
        // inputs, so use getAllByText and assert the dynamic <li> is present.
        const matches = screen.getAllByText(/be at least 8 characters long/i);
        expect(matches.some((el) => el.tagName === "LI")).toBe(true);
      });
      expect(authClient.signUp.email).not.toHaveBeenCalled();
    });

    it("shows password letter error when password has no letters", async () => {
      render(<SignupForm />);
      fillAndSubmit({ password: "12345678!", confirmPassword: "12345678!" });

      await waitFor(() => {
        expect(
          screen.getByText(/contain at least one letter/i),
        ).toBeInTheDocument();
      });
      expect(authClient.signUp.email).not.toHaveBeenCalled();
    });

    it("shows password number error when password has no numbers", async () => {
      render(<SignupForm />);
      fillAndSubmit({ password: "Password!", confirmPassword: "Password!" });

      await waitFor(() => {
        expect(
          screen.getByText(/contain at least one number/i),
        ).toBeInTheDocument();
      });
      expect(authClient.signUp.email).not.toHaveBeenCalled();
    });

    it("shows special character error when password has no special characters", async () => {
      render(<SignupForm />);
      fillAndSubmit({ password: "Password1", confirmPassword: "Password1" });

      await waitFor(() => {
        expect(
          screen.getByText(/contain at least one special character/i),
        ).toBeInTheDocument();
      });
      expect(authClient.signUp.email).not.toHaveBeenCalled();
    });

    it("shows confirm password mismatch error", async () => {
      render(<SignupForm />);
      fillAndSubmit({ confirmPassword: "DifferentPassword1!" });

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
      expect(authClient.signUp.email).not.toHaveBeenCalled();
    });
  });

  describe("Successful signup", () => {
    it("calls authClient.signUp.email with correct data", async () => {
      render(<SignupForm />);
      fillAndSubmit();

      await waitFor(() => {
        expect(authClient.signUp.email).toHaveBeenCalledWith({
          name: validFormData.name,
          email: validFormData.email,
          password: validFormData.password,
        });
      });
    });

    it("shows success toast and redirects to /login", async () => {
      render(<SignupForm />);
      fillAndSubmit();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Account created successfully!",
          expect.objectContaining({ position: "top-center" }),
        );
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Error responses from authClient", () => {
    it("shows specific message when email already exists", async () => {
      (authClient.signUp.email as jest.Mock).mockResolvedValue({
        error: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
      });

      render(<SignupForm />);
      fillAndSubmit();

      await waitFor(() => {
        expect(
          screen.getByText("An account with this email already exists."),
        ).toBeInTheDocument();
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("shows generic error message for unknown error codes", async () => {
      (authClient.signUp.email as jest.Mock).mockResolvedValue({
        error: { code: "SOME_OTHER_ERROR" },
      });

      render(<SignupForm />);
      fillAndSubmit();

      await waitFor(() => {
        expect(
          screen.getByText("Failed to create account."),
        ).toBeInTheDocument();
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Pending state", () => {
    it("disables the button and shows loading text while the request is in flight", async () => {
      let resolveSignup!: (value: { error: null }) => void;
      (authClient.signUp.email as jest.Mock).mockReturnValue(
        new Promise((res) => {
          resolveSignup = res;
        }),
      );

      render(<SignupForm />);
      fillAndSubmit();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /creating/i }),
        ).toBeDisabled();
      });

      resolveSignup({ error: null });
    });

    it("re-enables the button after a validation failure", async () => {
      render(<SignupForm />);
      fillAndSubmit({ name: "" });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create account/i }),
        ).not.toBeDisabled();
      });
    });

    it("re-enables the button after an authClient error", async () => {
      (authClient.signUp.email as jest.Mock).mockResolvedValue({
        error: { code: "SOME_OTHER_ERROR" },
      });

      render(<SignupForm />);
      fillAndSubmit();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create account/i }),
        ).not.toBeDisabled();
      });
    });
  });
});
