import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditUserForm from "@/components/ui/dashboard/admin/editUserForm";
import { authClient } from "@/lib/auth-client";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  redirect: jest.fn(),
}));

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    admin: {
      listUsers: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockListUsers = authClient.admin.listUsers as jest.Mock;
const mockUpdateUser = authClient.admin.updateUser as jest.Mock;

const chosenUser = {
  id: "user-123",
  name: "Jane Doe",
  email: "jane@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
  role: "user",
  banned: false,
  banReason: null,
  banExpires: null,
} as any;

const fillForm = (name = "Jane Doe", email = "jane@example.com") => {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
};

describe("EditUserForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with pre-filled user values", () => {
    render(<EditUserForm chosenUser={chosenUser} />);
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "Jane Doe",
    );
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe(
      "jane@example.com",
    );
  });

  it("does not call listUsers when name is empty", async () => {
    render(<EditUserForm chosenUser={chosenUser} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(mockListUsers).not.toHaveBeenCalled();
    });
  });

  it("does not call listUsers when email is invalid", async () => {
    render(<EditUserForm chosenUser={chosenUser} />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(mockListUsers).not.toHaveBeenCalled();
    });
  });

  it("shows duplicate email error when another user has the same email", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: "other-user-456", email: "jane@example.com" }] },
    });

    render(<EditUserForm chosenUser={chosenUser} />);
    fillForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists."),
      ).toBeInTheDocument();
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("does not show duplicate email error when the matching email belongs to the same user", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: "user-123", email: "jane@example.com" }] },
    });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });

    render(<EditUserForm chosenUser={chosenUser} />);
    fillForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        userId: "user-123",
        data: { name: "Jane Doe", email: "jane@example.com" },
      });
    });
  });

  it("does not show duplicate email error when no existing user is found", async () => {
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });

    render(<EditUserForm chosenUser={chosenUser} />);
    fillForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
    });
  });

  it("shows toast on updateUser failure", async () => {
    const { toast } = require("sonner");
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockUpdateUser.mockResolvedValue({
      data: null,
      error: { message: "Server error" },
    });

    render(<EditUserForm chosenUser={chosenUser} />);
    fillForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update user",
        expect.objectContaining({ position: "top-center" }),
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard/admin and shows success toast on successful update", async () => {
    const { toast } = require("sonner");
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });

    render(<EditUserForm chosenUser={chosenUser} />);
    fillForm("Updated Name", "updated@example.com");
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/admin");
    });
    expect(toast.success).toHaveBeenCalledWith(
      "User updated successfully!",
      expect.objectContaining({ position: "top-center" }),
    );
  });

  it("disables submit button and shows pending text while submitting", async () => {
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockUpdateUser.mockImplementation(() => new Promise(() => {}));

    render(<EditUserForm chosenUser={chosenUser} />);
    fillForm();
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Updating..." }),
      ).toBeDisabled();
    });
  });

  it("navigates to /dashboard/admin when Cancel is clicked", () => {
    render(<EditUserForm chosenUser={chosenUser} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/admin");
  });
});
