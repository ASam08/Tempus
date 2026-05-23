import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupForm } from "@/components/ui/usermigrationsetup/setup-form";
import { authClient } from "@/lib/auth-client";
import { markSetupComplete } from "@/lib/actions";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: jest.fn(),
    admin: {
      updateUser: jest.fn(),
      setUserPassword: jest.fn(),
    },
  },
}));

jest.mock("@/lib/actions", () => ({
  markSetupComplete: jest.fn(),
}));

const mockUpdateUser = authClient.admin.updateUser as jest.Mock;
const mockSetUserPassword = authClient.admin.setUserPassword as jest.Mock;
const mockMarkSetupComplete = markSetupComplete as jest.Mock;
const mockUseSession = authClient.useSession as jest.Mock;

const validFormData = {
  name: "Jane Doe",
  email: "jane@example.com",
  password: "Password1!",
  confirmPassword: "Password1!",
};

async function fillForm(overrides: Partial<typeof validFormData> = {}) {
  const data = { ...validFormData, ...overrides };
  const user = userEvent.setup();
  if (data.name) await user.type(screen.getByLabelText("Name"), data.name);
  if (data.email) await user.type(screen.getByLabelText("Email"), data.email);
  if (data.password)
    await user.type(screen.getByLabelText("Password"), data.password);
  if (data.confirmPassword)
    await user.type(
      screen.getByLabelText("Confirm Password"),
      data.confirmPassword,
    );
}

function submitForm() {
  fireEvent.submit(
    screen.getByRole("button", { name: "Complete Setup" }).closest("form")!,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSession.mockReturnValue({ data: { user: { id: "user-123" } } });
  mockUpdateUser.mockResolvedValue({ error: null });
  mockSetUserPassword.mockResolvedValue({ error: null });
  mockMarkSetupComplete.mockResolvedValue(undefined);
});

describe("SetupForm", () => {
  it("renders the setup form with all fields", () => {
    render(<SetupForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Complete Setup" }),
    ).toBeInTheDocument();
  });

  it("renders heading and description", () => {
    render(<SetupForm />);
    expect(screen.getByText("Welcome to Tempus")).toBeInTheDocument();
    expect(screen.getByText(/get your account set up/i)).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    render(<SetupForm />);
    await fillForm({ name: "" });
    submitForm();
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    render(<SetupForm />);
    await fillForm({ email: "not-an-email" });
    submitForm();
    expect(
      await screen.findByText("Invalid email address"),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows validation error for the reserved admin email", async () => {
    render(<SetupForm />);
    await fillForm({ email: "admin@tempus.local" });
    submitForm();
    expect(
      await screen.findByText("Please enter your real email address"),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows password validation errors when password is too short", async () => {
    render(<SetupForm />);
    await fillForm({ password: "abc", confirmPassword: "abc" });
    submitForm();
    const errorList = await screen.findByRole("list");
    expect(
      within(errorList).getByText(/at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows password validation error when no letter present", async () => {
    render(<SetupForm />);
    await fillForm({ password: "12345678!", confirmPassword: "12345678!" });
    submitForm();
    expect(await screen.findByText(/at least one letter/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows password validation error when no number present", async () => {
    render(<SetupForm />);
    await fillForm({ password: "Password!!", confirmPassword: "Password!!" });
    submitForm();
    expect(await screen.findByText(/at least one number/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows password validation error when no special character present", async () => {
    render(<SetupForm />);
    await fillForm({ password: "Password1", confirmPassword: "Password1" });
    submitForm();
    expect(
      await screen.findByText(/at least one special character/i),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    render(<SetupForm />);
    await fillForm({ confirmPassword: "DifferentPass1!" });
    submitForm();
    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows session error when session has no user id", async () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<SetupForm />);
    await fillForm();
    submitForm();
    expect(
      await screen.findByText("Session not found. Please log in again."),
    ).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows duplicate email error when updateUser returns USER_ALREADY_EXISTS", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    });
    render(<SetupForm />);
    await fillForm();
    submitForm();
    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
    expect(mockSetUserPassword).not.toHaveBeenCalled();
  });

  it("shows generic error when updateUser returns an unknown error", async () => {
    mockUpdateUser.mockResolvedValue({ error: { code: "UNKNOWN_ERROR" } });
    render(<SetupForm />);
    await fillForm();
    submitForm();
    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(mockSetUserPassword).not.toHaveBeenCalled();
  });

  it("shows password error when setUserPassword fails", async () => {
    mockSetUserPassword.mockResolvedValue({ error: { code: "SOME_ERROR" } });
    render(<SetupForm />);
    await fillForm();
    submitForm();
    expect(
      await screen.findByText(
        "Something went wrong setting your password. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(mockMarkSetupComplete).not.toHaveBeenCalled();
  });

  it("shows error when markSetupComplete returns an error", async () => {
    mockMarkSetupComplete.mockResolvedValue({ error: "Setup failed" });
    render(<SetupForm />);
    await fillForm();
    submitForm();
    expect(await screen.findByText("Setup failed")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("completes setup successfully and redirects to dashboard", async () => {
    const { toast } = require("sonner");
    render(<SetupForm />);
    await fillForm();
    submitForm();
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        userId: "user-123",
        data: { name: "Jane Doe", email: "jane@example.com" },
      });
    });
    expect(mockSetUserPassword).toHaveBeenCalledWith({
      userId: "user-123",
      newPassword: "Password1!",
    });
    expect(mockMarkSetupComplete).toHaveBeenCalledWith("user-123");
    expect(toast.success).toHaveBeenCalledWith(
      "Setup complete! Welcome to Tempus.",
      { position: "top-center" },
    );
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("disables the button and shows Saving... while submitting", async () => {
    let resolveUpdate: (v: unknown) => void;
    mockUpdateUser.mockReturnValue(
      new Promise((res) => {
        resolveUpdate = res;
      }),
    );
    render(<SetupForm />);
    await fillForm();
    submitForm();
    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    resolveUpdate!({ error: null });
  });
});
