import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
const mockDeleteTimetableSet = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("@/lib/actions", () => ({
  deleteTimetableSet: (...args: unknown[]) => mockDeleteTimetableSet(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock("@/components/ui/alert-dialog", () =>
  require("@/testing/mocks/shadcn").alertDialogMock(),
);

import SetManageActions from "@/app/ui/timetable/setmanageactions";

const defaultTimetable = {
  id: "timetable-1",
  title: "Semester One",
  description: "My weekly classes",
};

function renderComponent(
  timetable: {
    id: string;
    title: string;
    description: string | null;
  } = defaultTimetable,
) {
  const { container } = render(<SetManageActions {...timetable} />);
  const icons = container.querySelectorAll("svg");
  return { container, editIcon: icons[0], deleteIcon: icons[1] };
}

describe("SetManageActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteTimetableSet.mockResolvedValue({ message: null });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe("rendering", () => {
    it("renders the edit and delete icons", () => {
      const { editIcon, deleteIcon } = renderComponent();
      expect(editIcon).toBeInTheDocument();
      expect(deleteIcon).toBeInTheDocument();
    });

    it("does NOT show the delete confirmation dialog initially", () => {
      renderComponent();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  describe("edit action", () => {
    it("navigates to the edit page with the timetable id when the edit icon is clicked", () => {
      const { editIcon } = renderComponent({
        ...defaultTimetable,
        id: "timetable-42",
      });
      fireEvent.click(editIcon);
      expect(mockPush).toHaveBeenCalledWith(
        "/dashboard/timetable/edit/timetable-42",
      );
    });

    it("does NOT open the delete dialog when the edit icon is clicked", () => {
      const { editIcon } = renderComponent();
      fireEvent.click(editIcon);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  describe("delete confirmation dialog", () => {
    it("opens the dialog when the delete icon is clicked", () => {
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("shows the confirmation title", () => {
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
    });

    it("shows the timetable title in the confirmation description", () => {
      const { deleteIcon } = renderComponent({
        ...defaultTimetable,
        title: "My Custom Timetable",
      });
      fireEvent.click(deleteIcon);
      expect(screen.getByText(/my custom timetable/i)).toBeInTheDocument();
    });

    it("warns that the action cannot be undone", () => {
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      expect(
        screen.getByText(/this action cannot be undone/i),
      ).toBeInTheDocument();
    });

    it("closes the dialog and does NOT delete when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(mockDeleteTimetableSet).not.toHaveBeenCalled();
    });
  });

  describe("delete confirmed - success", () => {
    it("calls deleteTimetableSet with the timetable id", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent({
        ...defaultTimetable,
        id: "timetable-99",
      });
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      expect(mockDeleteTimetableSet).toHaveBeenCalledWith("timetable-99");
    });

    it("closes the dialog after a successful delete", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
    });

    it("shows a success toast with the timetable title", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent({
        ...defaultTimetable,
        title: "Semester Two",
      });
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'Timetable "Semester Two" deleted successfully.',
          expect.objectContaining({ position: "top-center" }),
        ),
      );
    });

    it("navigates to the timetable dashboard", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(mockPush).toHaveBeenCalledWith("/dashboard/timetable"),
      );
    });

    it("does NOT show an error toast", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });

  describe("delete confirmed - server returns an error message", () => {
    beforeEach(() => {
      mockDeleteTimetableSet.mockResolvedValue({
        message: "Timetable is in use and cannot be deleted.",
      });
    });

    it("shows an error toast with the returned message", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith(
          "Timetable is in use and cannot be deleted.",
          expect.objectContaining({ position: "top-center" }),
        ),
      );
    });

    it("closes the dialog", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
    });

    it("does NOT navigate away", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() => expect(mockToastError).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("does NOT show a success toast", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() => expect(mockToastError).toHaveBeenCalled());
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe("delete confirmed - unexpected error thrown", () => {
    beforeEach(() => {
      mockDeleteTimetableSet.mockRejectedValue(new Error("Network error"));
    });

    it("logs the unexpected error", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(console.error).toHaveBeenCalledWith(
          "Unexpected error deleting timetable set:",
          expect.any(Error),
        ),
      );
    });

    it("closes the dialog", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
    });

    it("shows a generic error toast", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith(
          "Something went wrong. Please try again.",
          expect.objectContaining({ position: "top-center" }),
        ),
      );
    });

    it("does NOT navigate away", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent();
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() => expect(mockToastError).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
