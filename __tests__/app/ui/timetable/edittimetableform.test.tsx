import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockFormAction = jest.fn();
const mockAction = jest.fn();

jest.mock("next/link", () => {
  const Link = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>;
  Link.displayName = "Link";
  return Link;
});

jest.mock(
  "@/components/ui/label",
  () => require("@/testing/mocks/shadcn").labelMock,
);

jest.mock(
  "@/components/ui/input",
  () => require("@/testing/mocks/shadcn").inputMock,
);

jest.mock(
  "@/components/ui/textarea",
  () => require("@/testing/mocks/shadcn").textareaMock,
);

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

import EditTimetable from "@/app/ui/timetable/edittimetableform";

const defaultTimetable = {
  id: "timetable-1",
  title: "Semester One",
  description: "My weekly classes",
};

function renderComponent(
  currentTimetable: {
    id: string;
    title: string;
    description: string | null;
  } = defaultTimetable,
  state: Record<string, unknown> = {},
) {
  jest
    .spyOn(React, "useActionState")
    .mockReturnValue([state, mockFormAction, false]);
  return render(
    <EditTimetable action={mockAction} currentTimetable={currentTimetable} />,
  );
}

describe("EditTimetable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the heading", () => {
      renderComponent();
      expect(
        screen.getByRole("heading", { name: /edit timetable/i }),
      ).toBeInTheDocument();
    });

    it("renders the title input pre-populated from currentTimetable", () => {
      renderComponent();
      expect(screen.getByLabelText(/^title$/i)).toHaveValue("Semester One");
    });

    it("marks the title input as required", () => {
      renderComponent();
      expect(screen.getByLabelText(/^title$/i)).toBeRequired();
    });

    it("renders the description textarea pre-populated from currentTimetable", () => {
      renderComponent();
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        "My weekly classes",
      );
    });

    it("renders an empty description when currentTimetable.description is null", () => {
      renderComponent({ ...defaultTimetable, description: null });
      expect(screen.getByLabelText(/description/i)).toHaveValue("");
    });

    it("renders the description placeholder text", () => {
      renderComponent();
      expect(
        screen.getByPlaceholderText("Add a description"),
      ).toBeInTheDocument();
    });

    it("renders the Cancel link pointing to /dashboard/timetable", () => {
      renderComponent();
      expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
        "href",
        "/dashboard/timetable",
      );
    });

    it("renders the Save changes submit button", () => {
      renderComponent();
      expect(
        screen.getByRole("button", { name: /save changes/i }),
      ).toHaveAttribute("type", "submit");
    });
  });

  describe("form submission", () => {
    it("calls formAction with the edited title and description", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.clear(screen.getByLabelText(/^title$/i));
      await user.type(screen.getByLabelText(/^title$/i), "Semester Two");
      await user.clear(screen.getByLabelText(/description/i));
      await user.type(
        screen.getByLabelText(/description/i),
        "Updated description",
      );
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => expect(mockFormAction).toHaveBeenCalledTimes(1));
      const formData: FormData = mockFormAction.mock.calls[0][0];
      expect(formData.get("title")).toBe("Semester Two");
      expect(formData.get("description")).toBe("Updated description");
    });

    it("submits an empty description when cleared, since it is optional", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.clear(screen.getByLabelText(/description/i));
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => expect(mockFormAction).toHaveBeenCalledTimes(1));
      const formData: FormData = mockFormAction.mock.calls[0][0];
      expect(formData.get("description")).toBe("");
    });
  });
});
