import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
const mockDeleteTimetableSet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("@/lib/actions", () => ({
  deleteTimetableSet: (...args: unknown[]) => mockDeleteTimetableSet(...args),
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
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
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

    it("calls deleteTimetableSet with the timetable id when Delete is confirmed", async () => {
      const user = userEvent.setup();
      const { deleteIcon } = renderComponent({
        ...defaultTimetable,
        id: "timetable-99",
      });
      fireEvent.click(deleteIcon);
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      expect(mockDeleteTimetableSet).toHaveBeenCalledWith("timetable-99");
    });
  });
});
