import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockCreateNewTimetableSet = jest.fn();

jest.mock("@/lib/actions", () => ({
  createNewTimetableSet: (...args: unknown[]) =>
    mockCreateNewTimetableSet(...args),
}));

const mockFormAction = jest.fn();
jest
  .spyOn(React, "useActionState")
  .mockReturnValue([{}, mockFormAction, false]);

jest.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock(
  "@/components/ui/input",
  () => require("@/testing/mocks/shadcn").inputMock,
);

jest.mock("@/components/ui/textarea", () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

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

import CreateTimetable from "@/app/ui/timetable/createtimetableform";

describe("CreateTimetable", () => {
  beforeEach(() => {
    mockCreateNewTimetableSet.mockReset();
    mockFormAction.mockReset();
  });

  it("renders the form correctly", () => {
    render(<CreateTimetable />);
    expect(
      screen.getByRole("heading", { name: /create a new timetable/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it("calls createNewTimetableSet with form data on submit", async () => {
    render(<CreateTimetable />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/title/i), "My Timetable");
    await user.type(
      screen.getByLabelText(/description/i),
      "This is a test timetable.",
    );
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalledWith(
        expect.objectContaining({ get: expect.any(Function) }),
      );
    });

    const formData: FormData = mockFormAction.mock.calls[0][0];
    expect(formData.get("title")).toBe("My Timetable");
    expect(formData.get("description")).toBe("This is a test timetable.");
  });

  it("cancel button links to /dashboard/timetable", () => {
    render(<CreateTimetable />);
    const cancelLink = screen.getByRole("link", { name: /cancel/i });
    expect(cancelLink).toHaveAttribute("href", "/dashboard/timetable");
  });
  it("title input is required", () => {
    render(<CreateTimetable />);
    expect(screen.getByLabelText(/title/i)).toBeRequired();
  });
});
