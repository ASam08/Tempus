import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(),
}));

jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type,
    disabled,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    type?: "submit" | "button" | "reset";
    disabled?: boolean;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  __esModule: true,
  Select: ({
    children,
    onValueChange,
    name,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
    name?: string;
  }) => (
    <select
      name={name}
      aria-label="Day"
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  } & React.OptionHTMLAttributes<HTMLOptionElement>) => (
    <option {...props}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  __esModule: true,
  AlertDialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogAction: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

jest.mock("@/components/ui/field", () => ({
  Field: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FieldLabel: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock("@/lib/actions", () => ({
  addTimetableBlock: jest.fn(),
  unhideDow: jest.fn(),
}));

jest.mock("@/lib/constants", () => ({
  dowKeyValue: [
    { key: "monday", label: "Monday", dow: 1 },
    { key: "tuesday", label: "Tuesday", dow: 2 },
    { key: "wednesday", label: "Wednesday", dow: 3 },
    { key: "thursday", label: "Thursday", dow: 4 },
    { key: "friday", label: "Friday", dow: 5 },
    { key: "saturday", label: "Saturday", dow: 6 },
    { key: "sunday", label: "Sunday", dow: 7 },
  ],
}));

jest.mock("@/lib/defaults", () => ({
  defaultDaySettings: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
}));

import AddTimetableBlock from "@/app/ui/timetable/addtimetableblock";

const setupMocks = (stateOverrides = {}) => {
  const { useActionState } = require("react");
  useActionState.mockReturnValue([
    { message: "", errors: {}, conflicts: [], ...stateOverrides },
    jest.fn(),
  ]);
};

// Fills in the minimum valid form fields to pass client validation
const fillValidForm = (container: HTMLElement) => {
  fireEvent.change(container.querySelector("select")!, {
    target: { value: "1" },
  });
  fireEvent.change(container.querySelector("#subject")!, {
    target: { value: "Maths" },
  });
  fireEvent.change(container.querySelector("#location")!, {
    target: { value: "Room 101" },
  });
  fireEvent.change(container.querySelector("#start_time")!, {
    target: { value: "09:00" },
  });
  fireEvent.change(container.querySelector("#end_time")!, {
    target: { value: "10:00" },
  });
};

describe("AddTimetableBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<AddTimetableBlock settings={null} />);
    });

    it("renders the form heading", () => {
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByText("Add Timetable Block")).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      expect(container.querySelector("select")).toBeInTheDocument();
      expect(container.querySelector("#subject")).toBeInTheDocument();
      expect(container.querySelector("#location")).toBeInTheDocument();
      expect(container.querySelector("#start_time")).toBeInTheDocument();
      expect(container.querySelector("#end_time")).toBeInTheDocument();
    });

    it("renders Save and Cancel buttons", () => {
      render(<AddTimetableBlock settings={null} />);
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Cancel" })).toBeInTheDocument();
    });

    it("Cancel link points to /dashboard/timetable", () => {
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
        "href",
        "/dashboard/timetable",
      );
    });

    it("renders a day option for each day of the week", () => {
      render(<AddTimetableBlock settings={null} />);
      [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ].forEach((day) => expect(screen.getByText(day)).toBeInTheDocument());
    });

    it("does not show alert dialog on initial render", () => {
      render(<AddTimetableBlock settings={null} />);
      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });
  });

  describe("client validation", () => {
    it("shows error when Save is clicked with no fields filled", () => {
      render(<AddTimetableBlock settings={null} />);
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(screen.getByText("Please select a day")).toBeInTheDocument();
      expect(screen.getByText("Subject is required")).toBeInTheDocument();
      expect(screen.getByText("Location is required")).toBeInTheDocument();
      expect(screen.getByText("Start time is required")).toBeInTheDocument();
      expect(screen.getByText("End time is required")).toBeInTheDocument();
    });

    it("shows error when end time is before start time", () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      fireEvent.change(container.querySelector("#start_time")!, {
        target: { value: "10:00" },
      });
      fireEvent.change(container.querySelector("#end_time")!, {
        target: { value: "09:00" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(
        screen.getByText("End time must be after start time"),
      ).toBeInTheDocument();
    });

    it("shows error when end time equals start time", () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      fireEvent.change(container.querySelector("#start_time")!, {
        target: { value: "10:00" },
      });
      fireEvent.change(container.querySelector("#end_time")!, {
        target: { value: "10:00" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(
        screen.getByText("End time must be after start time"),
      ).toBeInTheDocument();
    });

    it("clears day error when select is opened", () => {
      render(<AddTimetableBlock settings={null} />);
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(screen.getByText("Please select a day")).toBeInTheDocument();
      // onOpenChange fires when the select opens
      fireEvent.focus(screen.getByRole("combobox"));
      expect(screen.queryByText("Please select a day")).not.toBeInTheDocument();
    });

    it("clears subject error when subject input changes", () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(screen.getByText("Subject is required")).toBeInTheDocument();
      fireEvent.change(container.querySelector("#subject")!, {
        target: { value: "Maths" },
      });
      expect(screen.queryByText("Subject is required")).not.toBeInTheDocument();
    });

    it("clears location error when location input changes", () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(screen.getByText("Location is required")).toBeInTheDocument();
      fireEvent.change(container.querySelector("#location")!, {
        target: { value: "Room 101" },
      });
      expect(
        screen.queryByText("Location is required"),
      ).not.toBeInTheDocument();
    });

    it("clears time errors when start time changes", () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(screen.getByText("Start time is required")).toBeInTheDocument();
      fireEvent.change(container.querySelector("#start_time")!, {
        target: { value: "09:00" },
      });
      expect(
        screen.queryByText("Start time is required"),
      ).not.toBeInTheDocument();
    });
  });

  describe("day hidden logic", () => {
    it("shows alert dialog when a hidden day is selected and form is valid", async () => {
      // Saturday has defaultDaySettings = false, so it is hidden by default
      const { container } = render(<AddTimetableBlock settings={null} />);
      fillValidForm(container);

      // Select Saturday (dow: 6)
      fireEvent.change(container.querySelector("select")!, {
        target: { value: "6" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      });

      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
      expect(screen.getByText("Saturday is hidden")).toBeInTheDocument();
    });

    it("does not show alert dialog when a visible day is selected", async () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      fillValidForm(container);

      // Monday is visible by default (dow: 1), already selected by fillValidForm
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      });

      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });

    it("shows alert dialog when settings explicitly hide a day", async () => {
      const { container } = render(
        <AddTimetableBlock settings={{ saturday: "false" }} />,
      );
      fillValidForm(container);
      fireEvent.change(container.querySelector("select")!, {
        target: { value: "6" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      });

      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    });

    it("does not show alert dialog when settings explicitly show a day", async () => {
      const { container } = render(
        <AddTimetableBlock settings={{ saturday: "true" }} />,
      );
      fillValidForm(container);
      fireEvent.change(container.querySelector("select")!, {
        target: { value: "6" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      });

      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });

    it("calls unhideDow and closes dialog when 'Yes, unhide it' is clicked", async () => {
      const { unhideDow } = require("@/lib/actions");
      const { container } = render(<AddTimetableBlock settings={null} />);
      fillValidForm(container);
      fireEvent.change(container.querySelector("select")!, {
        target: { value: "6" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      });

      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Yes, unhide it" }));
      });

      expect(unhideDow).toHaveBeenCalledWith("saturday");
      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });

    it("closes dialog without calling unhideDow when 'No, leave it hidden' is clicked", async () => {
      const { unhideDow } = require("@/lib/actions");
      const { container } = render(<AddTimetableBlock settings={null} />);
      fillValidForm(container);
      fireEvent.change(container.querySelector("select")!, {
        target: { value: "6" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "No, leave it hidden" }),
        );
      });

      expect(unhideDow).not.toHaveBeenCalled();
      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });

    it("closes dialog without submitting when Cancel is clicked in dialog", async () => {
      const { container } = render(<AddTimetableBlock settings={null} />);
      fillValidForm(container);
      fireEvent.change(container.querySelector("select")!, {
        target: { value: "6" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
      });

      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      });

      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });
  });

  describe("server action state", () => {
    it("renders server-side day errors", () => {
      setupMocks({ errors: { day: ["Day is required"] } });
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByText("Day is required")).toBeInTheDocument();
    });

    it("renders server-side subject errors", () => {
      setupMocks({ errors: { subject: ["Subject is required"] } });
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByText("Subject is required")).toBeInTheDocument();
    });

    it("renders server-side location errors", () => {
      setupMocks({ errors: { location: ["Location is required"] } });
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByText("Location is required")).toBeInTheDocument();
    });

    it("renders server-side start_time errors", () => {
      setupMocks({ errors: { start_time: ["Start time is invalid"] } });
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByText("Start time is invalid")).toBeInTheDocument();
    });

    it("renders server-side end_time errors", () => {
      setupMocks({ errors: { end_time: ["End time is invalid"] } });
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByText("End time is invalid")).toBeInTheDocument();
    });

    it("renders conflict blocks when returned from server", () => {
      setupMocks({
        conflicts: [
          {
            id: "1",
            subject: "Physics",
            start_time: "09:00:00",
            end_time: "10:00:00",
          },
        ],
      });
      render(<AddTimetableBlock settings={null} />);
      expect(screen.getByText("Conflict with:")).toBeInTheDocument();
      expect(screen.getByText(/Physics/)).toBeInTheDocument();
      expect(screen.getByText(/09:00 - 10:00/)).toBeInTheDocument();
    });
  });
});
