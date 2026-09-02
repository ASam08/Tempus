import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ColourPicker from "@/components/general/colour-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

jest.mock("@/lib/constants", () => ({
  timetableColours: ["red", "blue", "green", "yellow", "orange", "purple"],
  colourStyles: {
    red: "bg-red-600",
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    orange: "bg-orange-600",
    purple: "bg-purple-600",
  },
}));

jest.mock("@/components/ui/select", () => {
  const { selectMock } = require("@/testing/mocks/shadcn");
  return {
    __esModule: true,
    Select: jest.fn(selectMock.Select),
    SelectTrigger: jest.fn(selectMock.SelectTrigger),
    SelectValue: jest.fn(selectMock.SelectValue),
    SelectContent: jest.fn(selectMock.SelectContent),
    SelectItem: jest.fn(selectMock.SelectItem),
  };
});

describe("ColourPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a select named colour with the given value", () => {
    const handleValueChange = jest.fn();
    render(<ColourPicker value="blue" onValueChange={handleValueChange} />);
    expect(Select).toHaveBeenCalledWith(
      expect.objectContaining({ value: "blue", name: "colour" }),
      undefined,
    );
  });

  it("styles the trigger with the given value's background and a fixed width", () => {
    const handleValueChange = jest.fn();
    render(<ColourPicker value="blue" onValueChange={handleValueChange} />);
    expect(SelectTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        className: expect.stringContaining("bg-blue-600"),
      }),
      undefined,
    );
    expect(SelectTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        className: expect.stringContaining("w-36"),
      }),
      undefined,
    );
  });

  it("renders the select value with a capitalize class", () => {
    const handleValueChange = jest.fn();
    render(<ColourPicker value="red" onValueChange={handleValueChange} />);
    expect(SelectValue).toHaveBeenCalledWith(
      expect.objectContaining({ className: "capitalize" }),
      undefined,
    );
  });

  it("renders the select content aligned to the start without item alignment", () => {
    const handleValueChange = jest.fn();
    render(<ColourPicker value="red" onValueChange={handleValueChange} />);
    expect(SelectContent).toHaveBeenCalledWith(
      expect.objectContaining({
        alignItemWithTrigger: false,
        align: "start",
      }),
      undefined,
    );
  });

  it("renders every timetable colour as a selectable option", () => {
    const handleValueChange = jest.fn();
    render(<ColourPicker value="red" onValueChange={handleValueChange} />);
    const colourSelect = screen.getByRole("combobox", { name: "colour" });
    ["red", "blue", "green", "yellow", "orange", "purple"].forEach((colour) => {
      expect(
        within(colourSelect).getByRole("option", { name: colour }),
      ).toBeInTheDocument();
    });
  });

  it("styles each colour option with its own background and a capitalize class", () => {
    const handleValueChange = jest.fn();
    render(<ColourPicker value="red" onValueChange={handleValueChange} />);
    ["red", "blue", "green", "yellow", "orange", "purple"].forEach((colour) => {
      expect(SelectItem).toHaveBeenCalledWith(
        expect.objectContaining({
          value: colour,
          className: expect.stringContaining(`bg-${colour}-600`),
        }),
        undefined,
      );
      expect(SelectItem).toHaveBeenCalledWith(
        expect.objectContaining({
          value: colour,
          className: expect.stringContaining("capitalize"),
        }),
        undefined,
      );
    });
  });

  it("calls onValueChange with the newly selected colour", async () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();
    render(<ColourPicker value="red" onValueChange={handleValueChange} />);
    const colourSelect = screen.getByRole("combobox", { name: "colour" });

    await user.selectOptions(colourSelect, "green");

    expect(handleValueChange).toHaveBeenCalledWith("green");
  });

  it("does not call onValueChange when the underlying select emits an empty value", async () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();
    render(<ColourPicker value="red" onValueChange={handleValueChange} />);
    const colourSelect = screen.getByRole("combobox", { name: "colour" });

    await user.selectOptions(colourSelect, "");

    expect(handleValueChange).not.toHaveBeenCalled();
  });

  it("reflects a new value and trigger styling when the value prop changes", () => {
    const handleValueChange = jest.fn();
    const { rerender } = render(
      <ColourPicker value="red" onValueChange={handleValueChange} />,
    );

    rerender(<ColourPicker value="green" onValueChange={handleValueChange} />);

    expect(Select).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "green" }),
      undefined,
    );
    expect(SelectTrigger).toHaveBeenLastCalledWith(
      expect.objectContaining({
        className: expect.stringContaining("bg-green-600"),
      }),
      undefined,
    );
  });
});
