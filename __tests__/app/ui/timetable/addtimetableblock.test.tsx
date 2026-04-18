import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

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

const mockAddTimetableBlock = jest.fn();
const mockUnhideDow = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/actions", () => ({
  addTimetableBlock: (...args: unknown[]) => mockAddTimetableBlock(...args),
  unhideDow: (...args: unknown[]) => mockUnhideDow(...args),
}));

jest.mock("@/lib/constants", () => ({
  dowKeyValue: [
    { dow: 1, key: "monday", label: "Monday" },
    { dow: 2, key: "tuesday", label: "Tuesday" },
    { dow: 3, key: "wednesday", label: "Wednesday" },
    { dow: 4, key: "thursday", label: "Thursday" },
    { dow: 5, key: "friday", label: "Friday" },
    { dow: 6, key: "saturday", label: "Saturday" },
    { dow: 7, key: "sunday", label: "Sunday" },
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
    onClick,
    type,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    variant?: string;
  }) => (
    <button type={type ?? "button"} onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    name,
    onOpenChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    name?: string;
    onOpenChange?: () => void;
  }) => (
    <select
      name={name}
      onChange={(e) => {
        onOpenChange?.();
        onValueChange?.(e.target.value);
      }}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

jest.mock("@/components/ui/alert-dialog", () => {
  const React = jest.requireActual("react");
  const AlertDialogContext = React.createContext<
    ((open: boolean) => void) | undefined
  >(undefined);

  return {
    AlertDialog: ({
      open,
      onOpenChange,
      children,
    }: {
      open: boolean;
      onOpenChange?: (v: boolean) => void;
      children: React.ReactNode;
    }) =>
      open ? (
        <AlertDialogContext.Provider value={onOpenChange}>
          <div role="alertdialog">{children}</div>
        </AlertDialogContext.Provider>
      ) : null,
    AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
    AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
      <p>{children}</p>
    ),
    AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
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
      variant,
    }: {
      children: React.ReactNode;
      variant?: string;
    }) => {
      const onOpenChange = React.useContext(AlertDialogContext);
      return (
        <button
          type="button"
          data-variant={variant}
          onClick={() => onOpenChange?.(false)}
        >
          {children}
        </button>
      );
    },
  };
});

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

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useActionState: (
      _action: unknown,
      initialState: Record<string, unknown>,
    ): [Record<string, unknown>, (fd: FormData) => void] => {
      const [state, setState] = actual.useState(initialState);
      const formAction = (formData: FormData) => {
        const result = mockAddTimetableBlock(formData);
        if (result && typeof result.then === "function") {
          result.then((r: unknown) => r && setState(r));
        } else if (result) {
          setState(result);
        }
      };
      return [state, formAction];
    },
  };
});

import AddTimetableBlock from "@/app/ui/timetable/addtimetableblock";

const defaultSettings: Record<string, string> = {
  monday: "true",
  tuesday: "true",
  wednesday: "true",
  thursday: "true",
  friday: "true",
  saturday: "false",
  sunday: "false",
};

function renderComponent(
  settings: Record<string, string> | null = defaultSettings,
) {
  return render(<AddTimetableBlock settings={settings} />);
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox"), "1"); // Monday
  await user.type(screen.getByPlaceholderText("e.g. Maths"), "Mathematics");
  await user.type(screen.getByPlaceholderText("e.g. Room 101"), "Room 202");
}

describe("AddTimetableBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddTimetableBlock.mockReturnValue(undefined);
  });

  describe("rendering", () => {
    it("renders the heading", () => {
      renderComponent();
      expect(screen.getByText("Add Timetable Block")).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      renderComponent();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. Maths")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. Room 101")).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/finish time/i)).toBeInTheDocument();
    });

    it("renders Cancel link pointing to /dashboard/timetable", () => {
      renderComponent();
      const cancelLink = screen.getByRole("link", { name: /cancel/i });
      expect(cancelLink).toHaveAttribute("href", "/dashboard/timetable");
    });

    it("renders Save changes button", () => {
      renderComponent();
      expect(
        screen.getByRole("button", { name: /save changes/i }),
      ).toBeInTheDocument();
    });

    it("sets default value 09:30 on start_time input", () => {
      renderComponent();
      expect(screen.getByLabelText(/start time/i)).toHaveValue("09:30");
    });

    it("sets default value 10:30 on end_time input", () => {
      renderComponent();
      expect(screen.getByLabelText(/finish time/i)).toHaveValue("10:30");
    });

    it("does NOT show the AlertDialog initially", () => {
      renderComponent();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("renders all days of the week in the select", () => {
      renderComponent();
      const select = screen.getByRole("combobox");
      [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ].forEach((day) =>
        expect(
          within(select).getByRole("option", { name: day }),
        ).toBeInTheDocument(),
      );
    });

    it("handles an unrecognised day value without crashing (covers label || '' fallback)", async () => {
      const user = userEvent.setup();
      renderComponent();
      const select = screen.getByRole("combobox");
      const option = document.createElement("option");
      option.value = "99";
      option.textContent = "Unknown";
      select.appendChild(option);
      await user.selectOptions(select, "99");
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  describe("client-side validation", () => {
    it("shows an error when no day is selected", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/please select a day/i),
      ).toBeInTheDocument();
    });

    it("shows an error when subject is empty", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/subject is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when subject is whitespace only", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "   ");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/subject is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when location is empty", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/location is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when end time is before start time", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);

      const startInput = screen.getByLabelText(/start time/i);
      const endInput = screen.getByLabelText(/finish time/i);

      await user.clear(startInput);
      await user.type(startInput, "10:00");
      await user.clear(endInput);
      await user.type(endInput, "09:00");

      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
    });

    it("shows an error when end time equals start time", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);

      const startInput = screen.getByLabelText(/start time/i);
      const endInput = screen.getByLabelText(/finish time/i);

      await user.clear(startInput);
      await user.type(startInput, "10:00");
      await user.clear(endInput);
      await user.type(endInput, "10:00");

      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
    });

    it("does NOT show time error when end time is after start time", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      // defaults are 09:30 / 10:30 — already valid
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.queryByText(/end time must be after start time/i),
      ).not.toBeInTheDocument();
    });

    it("does not submit the form when validation fails", async () => {
      const user = userEvent.setup();
      renderComponent();
      // click Save without filling anything
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockAddTimetableBlock).not.toHaveBeenCalled();
    });

    it("shows an error when start_time is cleared", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.clear(screen.getByLabelText(/start time/i));
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/start time is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when end_time is cleared", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.clear(screen.getByLabelText(/finish time/i));
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time is required/i),
      ).toBeInTheDocument();
    });
  });

  describe("clearing client errors", () => {
    it("clears the subject error when the subject input changes", async () => {
      const user = userEvent.setup();
      renderComponent();
      // Trigger the subject error
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/subject is required/i),
      ).toBeInTheDocument();
      // Now type in the subject field, error should disappear
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "M");
      expect(
        screen.queryByText(/subject is required/i),
      ).not.toBeInTheDocument();
    });

    it("clears the location error when the location input changes", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/location is required/i),
      ).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "1");
      expect(
        screen.queryByText(/location is required/i),
      ).not.toBeInTheDocument();
    });

    it("clears time errors when start_time input changes", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);

      const startInput = screen.getByLabelText(/start time/i);
      const endInput = screen.getByLabelText(/finish time/i);
      await user.clear(startInput);
      await user.type(startInput, "11:00");
      await user.clear(endInput);
      await user.type(endInput, "10:00");

      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();

      // Changing start should clear the end_time error too
      await user.clear(startInput);
      await user.type(startInput, "09:00");
      expect(
        screen.queryByText(/end time must be after start time/i),
      ).not.toBeInTheDocument();
    });

    it("clears the day error when day select changes", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/please select a day/i),
      ).toBeInTheDocument();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      expect(
        screen.queryByText(/please select a day/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("hidden-day AlertDialog", () => {
    it("shows the AlertDialog when a hidden day (Saturday) is selected with a valid form", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6"); // Saturday
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText(/saturday is hidden/i)).toBeInTheDocument();
    });

    it("does NOT show the AlertDialog for a visible day (Monday)", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user); // selects Monday which is visible
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("calls unhideDow and submits the form when 'Yes, unhide it' is clicked", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: /yes, unhide it/i }));

      await waitFor(() =>
        expect(mockUnhideDow).toHaveBeenCalledWith("saturday"),
      );
      await waitFor(() => expect(mockAddTimetableBlock).toHaveBeenCalled());
    });

    it("submits without unhideDow when 'No, leave it hidden' is clicked", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await screen.findByRole("alertdialog");
      await user.click(
        screen.getByRole("button", { name: /no, leave it hidden/i }),
      );

      expect(mockUnhideDow).not.toHaveBeenCalled();
      await waitFor(() => expect(mockAddTimetableBlock).toHaveBeenCalled());
    });

    it("closes the AlertDialog and does NOT submit when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

      expect(mockUnhideDow).not.toHaveBeenCalled();
      expect(mockAddTimetableBlock).not.toHaveBeenCalled();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("uses defaultDaySettings when settings prop is null", async () => {
      const user = userEvent.setup();
      // null settings = falls back to defaultDaySettings where saturday = false
      renderComponent(null);
      await user.selectOptions(screen.getByRole("combobox"), "6"); // Saturday
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });

    it("uses defaultDaySettings when the day key is missing from settings", async () => {
      const user = userEvent.setup();
      const settingsWithoutSaturday = { ...defaultSettings };
      delete settingsWithoutSaturday.saturday;
      renderComponent(settingsWithoutSaturday);
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("server-side errors from action state", () => {
    /**
     * To simulate server errors we re-implement useActionState so it can
     * receive a mock return value from mockAddTimetableBlock.
     */
    it("renders server-side day errors", async () => {
      mockAddTimetableBlock.mockReturnValue({
        message: "Validation error",
        errors: { day: ["Day is required"] },
        conflicts: [],
      });
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      // The mock returns server errors synchronously on submit
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(await screen.findByText("Day is required")).toBeInTheDocument();
    });

    it("renders server-side subject errors", async () => {
      mockAddTimetableBlock.mockReturnValue({
        message: "",
        errors: { subject: ["Subject must be at least 2 characters"] },
        conflicts: [],
      });
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText("Subject must be at least 2 characters"),
      ).toBeInTheDocument();
    });

    it("renders server-side location errors", async () => {
      mockAddTimetableBlock.mockReturnValue({
        message: "",
        errors: { location: ["Location is invalid"] },
        conflicts: [],
      });
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText("Location is invalid"),
      ).toBeInTheDocument();
    });

    it("renders server-side start_time errors", async () => {
      mockAddTimetableBlock.mockReturnValue({
        message: "",
        errors: { start_time: ["Start time is invalid"] },
        conflicts: [],
      });
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText("Start time is invalid"),
      ).toBeInTheDocument();
    });

    it("renders server-side end_time errors", async () => {
      mockAddTimetableBlock.mockReturnValue({
        message: "",
        errors: { end_time: ["End time is invalid"] },
        conflicts: [],
      });
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText("End time is invalid"),
      ).toBeInTheDocument();
    });

    it("renders server-side time conflicts", async () => {
      mockAddTimetableBlock.mockReturnValue({
        message: "",
        errors: {},
        conflicts: [
          {
            id: 42,
            subject: "Physics",
            start_time: "09:00:00",
            end_time: "10:00:00",
          },
        ],
      });
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(await screen.findByText(/conflict with/i)).toBeInTheDocument();
      expect(
        await screen.findByText(/Physics \(09:00 - 10:00\)/),
      ).toBeInTheDocument();
    });

    it("renders multiple conflicts", async () => {
      mockAddTimetableBlock.mockReturnValue({
        message: "",
        errors: {},
        conflicts: [
          {
            id: 1,
            subject: "Physics",
            start_time: "09:00:00",
            end_time: "10:00:00",
          },
          {
            id: 2,
            subject: "Chemistry",
            start_time: "09:30:00",
            end_time: "10:30:00",
          },
        ],
      });
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(await screen.findByText(/Physics/)).toBeInTheDocument();
      expect(await screen.findByText(/Chemistry/)).toBeInTheDocument();
    });
  });

  describe("successful submission", () => {
    it("calls the form action with FormData when a valid form is submitted", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() =>
        expect(mockAddTimetableBlock).toHaveBeenCalledTimes(1),
      );
      const formData: FormData = mockAddTimetableBlock.mock.calls[0][0];
      expect(formData.get("day_of_week")).toBe("1");
      expect(formData.get("subject")).toBe("Mathematics");
      expect(formData.get("location")).toBe("Room 202");
    });
  });
});
