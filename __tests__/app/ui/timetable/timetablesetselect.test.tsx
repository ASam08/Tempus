import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimetableSetSelect from "@/app/ui/timetable/timetablesetselect";
import { useRouter, usePathname } from "next/navigation";
import { setLastTimetableSet } from "@/lib/actions";
import { Select } from "@/components/ui/select";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock("@/lib/actions", () => ({
  setLastTimetableSet: jest.fn(),
}));

jest.mock("@/components/ui/select", () => {
  const { selectMock } = require("@/testing/mocks/shadcn");
  return {
    __esModule: true,
    Select: jest.fn(selectMock.Select),
    SelectTrigger: selectMock.SelectTrigger,
    SelectValue: selectMock.SelectValue,
    SelectContent: selectMock.SelectContent,
    SelectItem: selectMock.SelectItem,
  };
});

describe("TimetableSetSelect", () => {
  const mockPush = jest.fn();
  const timetableSets = [
    { id: "1", title: "Semester One" },
    { id: "2", title: "Semester Two" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as unknown as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as unknown as jest.Mock).mockReturnValue("/dashboard");
  });

  it("renders an option for each timetable set", () => {
    render(<TimetableSetSelect timetableSets={timetableSets} />);
    expect(
      screen.getByRole("option", { name: "Semester One" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Semester Two" }),
    ).toBeInTheDocument();
  });

  it("renders only the placeholder option when timetableSets is empty", () => {
    render(<TimetableSetSelect timetableSets={[]} />);
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("renders only the placeholder option when timetableSets is null", () => {
    render(<TimetableSetSelect timetableSets={null} />);
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("passes the selectedSetId through to the underlying Select", () => {
    render(
      <TimetableSetSelect timetableSets={timetableSets} selectedSetId="2" />,
    );
    expect(Select).toHaveBeenCalledWith(
      expect.objectContaining({ value: "2" }),
      undefined,
    );
  });

  it("pushes the new set id onto the URL and persists it on selection", async () => {
    const user = userEvent.setup();
    render(<TimetableSetSelect timetableSets={timetableSets} />);

    await user.selectOptions(screen.getByRole("combobox"), "1");

    expect(mockPush).toHaveBeenCalledWith("/dashboard?set=1");
    expect(setLastTimetableSet).toHaveBeenCalledWith("1");
  });

  it("builds the URL relative to the current pathname", async () => {
    (usePathname as unknown as jest.Mock).mockReturnValue("/timetables");
    const user = userEvent.setup();
    render(<TimetableSetSelect timetableSets={timetableSets} />);

    await user.selectOptions(screen.getByRole("combobox"), "2");

    expect(mockPush).toHaveBeenCalledWith("/timetables?set=2");
  });
});
