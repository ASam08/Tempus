import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockFormAction = jest.fn();
const mockUnhideDow = jest.fn().mockResolvedValue(undefined);

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

jest.mock("@/lib/actions", () => ({
  addTimetableBlock: jest.fn(),
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

jest.mock(
  "@/components/ui/input",
  () => require("@/testing/mocks/shadcn").inputMock,
);

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

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
      aria-label={name}
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
  const React = jest.requireActual("react") as typeof import("react");
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

jest.mock(
  "@/components/ui/field",
  () => require("@/testing/mocks/shadcn").fieldMock,
);

import AddTimetableBlock from "@/app/ui/timetable/addtimetableblock";

type Conflict = {
  id: number;
  subject: string;
  start_time: string;
  end_time: string;
};
type ActionState = {
  message: string;
  errors: Record<string, string[]>;
  conflicts: Conflict[];
};

const initialState: ActionState = { message: "", errors: {}, conflicts: [] };

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
  state: ActionState = initialState,
) {
  jest
    .spyOn(React, "useActionState")
    .mockReturnValue([state, mockFormAction, false]);
  return render(<AddTimetableBlock settings={settings} />);
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox"), "1");
  await user.type(screen.getByPlaceholderText("e.g. Maths"), "Mathematics");
  await user.type(screen.getByPlaceholderText("e.g. Room 101"), "Room 202");
}

describe("AddTimetableBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
        "href",
        "/dashboard/timetable",
      );
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

  describe("server-side errors from action state", () => {
    it("renders server-side day errors", () => {
      renderComponent(defaultSettings, {
        message: "Validation error",
        errors: { day: ["Day is required"] },
        conflicts: [],
      });
      expect(screen.getByText("Day is required")).toBeInTheDocument();
    });

    it("renders server-side subject errors", () => {
      renderComponent(defaultSettings, {
        message: "",
        errors: { subject: ["Subject must be at least 2 characters"] },
        conflicts: [],
      });
      expect(
        screen.getByText("Subject must be at least 2 characters"),
      ).toBeInTheDocument();
    });

    it("renders server-side location errors", () => {
      renderComponent(defaultSettings, {
        message: "",
        errors: { location: ["Location is invalid"] },
        conflicts: [],
      });
      expect(screen.getByText("Location is invalid")).toBeInTheDocument();
    });

    it("renders server-side start_time errors", () => {
      renderComponent(defaultSettings, {
        message: "",
        errors: { start_time: ["Start time is invalid"] },
        conflicts: [],
      });
      expect(screen.getByText("Start time is invalid")).toBeInTheDocument();
    });

    it("renders server-side end_time errors", () => {
      renderComponent(defaultSettings, {
        message: "",
        errors: { end_time: ["End time is invalid"] },
        conflicts: [],
      });
      expect(screen.getByText("End time is invalid")).toBeInTheDocument();
    });

    it("renders a server-side time conflict", () => {
      renderComponent(defaultSettings, {
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
      expect(screen.getByText(/conflict with/i)).toBeInTheDocument();
      expect(screen.getByText(/Physics \(09:00 - 10:00\)/)).toBeInTheDocument();
    });

    it("renders multiple conflicts", () => {
      renderComponent(defaultSettings, {
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
      expect(screen.getByText(/Physics/)).toBeInTheDocument();
      expect(screen.getByText(/Chemistry/)).toBeInTheDocument();
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

    it("shows an error when end time is before start time", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.clear(screen.getByLabelText(/start time/i));
      await user.type(screen.getByLabelText(/start time/i), "10:00");
      await user.clear(screen.getByLabelText(/finish time/i));
      await user.type(screen.getByLabelText(/finish time/i), "09:00");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
    });

    it("shows an error when end time equals start time", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.clear(screen.getByLabelText(/start time/i));
      await user.type(screen.getByLabelText(/start time/i), "10:00");
      await user.clear(screen.getByLabelText(/finish time/i));
      await user.type(screen.getByLabelText(/finish time/i), "10:00");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
    });

    it("does NOT show time error when end time is after start time", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.queryByText(/end time must be after start time/i),
      ).not.toBeInTheDocument();
    });

    it("does not submit the form when validation fails", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockFormAction).not.toHaveBeenCalled();
    });
  });

  describe("clearing client errors", () => {
    it("clears the subject error when the subject input changes", async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/subject is required/i),
      ).toBeInTheDocument();
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
      await user.clear(screen.getByLabelText(/start time/i));
      await user.type(screen.getByLabelText(/start time/i), "11:00");
      await user.clear(screen.getByLabelText(/finish time/i));
      await user.type(screen.getByLabelText(/finish time/i), "10:00");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
      await user.clear(screen.getByLabelText(/start time/i));
      await user.type(screen.getByLabelText(/start time/i), "09:00");
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
    it("shows the AlertDialog when a hidden day is selected with a valid form", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.type(screen.getByPlaceholderText("e.g. Maths"), "Maths");
      await user.type(screen.getByPlaceholderText("e.g. Room 101"), "101");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText(/saturday is hidden/i)).toBeInTheDocument();
    });

    it("does NOT show the AlertDialog for a visible day (Monday)", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
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
      await waitFor(() => expect(mockFormAction).toHaveBeenCalled());
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
      await waitFor(() => expect(mockFormAction).toHaveBeenCalled());
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
      expect(mockFormAction).not.toHaveBeenCalled();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("uses defaultDaySettings when settings prop is null", async () => {
      const user = userEvent.setup();
      renderComponent(null);
      await user.selectOptions(screen.getByRole("combobox"), "6");
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

  describe("successful submission", () => {
    it("calls the form action with FormData when a valid form is submitted", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() => expect(mockFormAction).toHaveBeenCalledTimes(1));
      const formData: FormData = mockFormAction.mock.calls[0][0];
      expect(formData.get("day_of_week")).toBe("1");
      expect(formData.get("subject")).toBe("Mathematics");
      expect(formData.get("location")).toBe("Room 202");
    });
  });
});
