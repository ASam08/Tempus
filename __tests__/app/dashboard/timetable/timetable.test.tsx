import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/data", () => ({
  __esModule: true,
  getUserID: jest.fn(),
  getTimetableSets: jest.fn(),
}));

jest.mock("@/app/ui/timetable/timetablegridserver", () => ({
  __esModule: true,
  default: () => <div>Timetable Grid</div>,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("lucide-react", () => ({
  LucideGrid2X2Plus: () => <svg data-testid="grid-icon" />,
  PlusCircle: () => <svg data-testid="plus-icon" />,
}));

import TimetablePage from "@/app/dashboard/timetable/page";

const mockedGetUserID = require("@/lib/data").getUserID;
const mockedGetTimetableSets = require("@/lib/data").getTimetableSets;

describe("TimetablePage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders timetable grid when user has sets", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetTimetableSets.mockResolvedValue([{ id: "set1" }]);
    const result = await TimetablePage();
    render(result);
    expect(screen.getByText("Timetable Grid")).toBeInTheDocument();
  });

  it("renders timetable grid when user has no sets", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetTimetableSets.mockResolvedValue([]);
    const result = await TimetablePage();
    render(result);
    expect(screen.getByText("Timetable Grid")).toBeInTheDocument();
  });

  it("renders timetable grid when user is not logged in", async () => {
    mockedGetUserID.mockResolvedValue(null);
    const result = await TimetablePage();
    render(result);
    expect(screen.getByText("Timetable Grid")).toBeInTheDocument();
  });

  it("shows create and add block buttons when user has sets", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetTimetableSets.mockResolvedValue([{ id: "set1" }]);
    const result = await TimetablePage();
    render(result);
    expect(screen.getByText("Create New Timetable")).toBeInTheDocument();
    expect(screen.getByText("Add Timetable Block")).toBeInTheDocument();
  });

  it("hides create and add block buttons when user has no sets", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetTimetableSets.mockResolvedValue([]);
    const result = await TimetablePage();
    render(result);
    expect(screen.queryByText("Create New Timetable")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Timetable Block")).not.toBeInTheDocument();
  });

  it("hides create and add block buttons when user is not logged in", async () => {
    mockedGetUserID.mockResolvedValue(null);
    const result = await TimetablePage();
    render(result);
    expect(screen.queryByText("Create New Timetable")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Timetable Block")).not.toBeInTheDocument();
  });

  it("renders the timetable heading", async () => {
    mockedGetUserID.mockResolvedValue(null);
    const result = await TimetablePage();
    render(result);
    expect(
      screen.getByRole("heading", { name: /timetable/i }),
    ).toBeInTheDocument();
  });
});
