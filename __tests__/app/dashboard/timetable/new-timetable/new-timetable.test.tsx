import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@/app/ui/timetable/createtimetableform", () => ({
  __esModule: true,
  default: () => <div>New Timetable Form</div>,
}));

import NewTimetablePage from "@/app/dashboard/timetable/new-timetable/page";

describe("NewTimetablePage", () => {
  it("renders the new timetable form", () => {
    render(<NewTimetablePage />);
    expect(screen.getByText("New Timetable Form")).toBeInTheDocument();
  });
});
