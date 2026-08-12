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

  it("renders a select named colour with the default colour as its value", () => {
    render(<ColourPicker defaultColour="blue" />);
    expect(Select).toHaveBeenCalledWith(
      expect.objectContaining({ value: "blue", name: "colour" }),
      undefined,
    );
  });

  it("styles the trigger with the default colour's background and a fixed width", () => {
    render(<ColourPicker defaultColour="blue" />);
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
    render(<ColourPicker defaultColour="red" />);
    expect(SelectValue).toHaveBeenCalledWith(
      expect.objectContaining({ className: "capitalize" }),
      undefined,
    );
  });

  it("renders the select content aligned to the start without item alignment", () => {
    render(<ColourPicker defaultColour="red" />);
    expect(SelectContent).toHaveBeenCalledWith(
      expect.objectContaining({
        alignItemWithTrigger: false,
        align: "start",
      }),
      undefined,
    );
  });

  it("renders every timetable colour as a selectable option", () => {
    render(<ColourPicker defaultColour="red" />);
    const colourSelect = screen.getByRole("combobox", { name: "colour" });
    ["red", "blue", "green", "yellow", "orange", "purple"].forEach((colour) => {
      expect(
        within(colourSelect).getByRole("option", { name: colour }),
      ).toBeInTheDocument();
    });
  });

  it("styles each colour option with its own background and a capitalize class", () => {
    render(<ColourPicker defaultColour="red" />);
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

  it("updates the select value and trigger styling when a different colour is chosen", async () => {
    const user = userEvent.setup();
    render(<ColourPicker defaultColour="red" />);
    const colourSelect = screen.getByRole("combobox", { name: "colour" });

    await user.selectOptions(colourSelect, "green");

    expect(colourSelect).toHaveValue("green");
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

  it("keeps the previously selected colour when the underlying select emits an empty value", async () => {
    const user = userEvent.setup();
    render(<ColourPicker defaultColour="red" />);
    const colourSelect = screen.getByRole("combobox", { name: "colour" });

    await user.selectOptions(colourSelect, "");

    expect(Select).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "red" }),
      undefined,
    );
    expect(SelectTrigger).toHaveBeenLastCalledWith(
      expect.objectContaining({
        className: expect.stringContaining("bg-red-600"),
      }),
      undefined,
    );
  });
});
