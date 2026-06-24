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
  updateTimetableBlock: jest.fn(),
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

jest.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | false | null)[]) =>
    classes.filter(Boolean).join(" "),
  timeToMinutes: (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
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
    defaultValue,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    name?: string;
    onOpenChange?: () => void;
    defaultValue?: string;
  }) => (
    <select
      name={name}
      aria-label={name}
      defaultValue={defaultValue}
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
  SelectValue: () => null,
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

jest.mock("@/components/ui/alert-dialog", () => 
  require("@/testing/mocks/shadcn").alertDialogMock(),
);

jest.mock(
  "@/components/ui/field",
  () => require("@/testing/mocks/shadcn").fieldMock,
);

import EditTimetableBlock from "@/app/ui/timetable/edittimetableblock";

type Conflict = {
  id: string;
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

const defaultBlock = {
  id: "block-1",
  day_of_week: 1,
  subject: "Mathematics",
  location: "Room 101",
  start_time: "09:00",
  end_time: "10:00",
};

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
  block: typeof defaultBlock = defaultBlock,
) {
  jest
    .spyOn(React, "useActionState")
    .mockReturnValue([state, mockFormAction, false]);
  return render(
    <EditTimetableBlock
      action={mockFormAction}
      settings={settings}
      currentBlock={block as any}
    />,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox"), "1");
  await user.clear(screen.getByLabelText(/subject/i));
  await user.type(screen.getByLabelText(/subject/i), "Mathematics");
  await user.clear(screen.getByLabelText(/location/i));
  await user.type(screen.getByLabelText(/location/i), "Room 101");
}

describe("EditTimetableBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnhideDow.mockResolvedValue(undefined);
    HTMLFormElement.prototype.requestSubmit = jest.fn(function (
      this: HTMLFormElement,
    ) {
      this.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
  });

  describe("rendering", () => {
    it("renders the heading", () => {
      renderComponent();
      expect(screen.getByText("Edit Timetable Block")).toBeInTheDocument();
    });

    it("renders description text", () => {
      renderComponent();
      expect(
        screen.getByText(/change the details below to edit/i),
      ).toBeInTheDocument();
    });

    it("renders subject input pre-populated from currentBlock", () => {
      renderComponent();
      expect(screen.getByLabelText(/subject/i)).toHaveValue("Mathematics");
    });

    it("renders location input pre-populated from currentBlock", () => {
      renderComponent();
      expect(screen.getByLabelText(/location/i)).toHaveValue("Room 101");
    });

    it("renders start time input pre-populated from currentBlock", () => {
      renderComponent();
      expect(screen.getByLabelText(/start time/i)).toHaveValue("09:00");
    });

    it("renders end time input pre-populated from currentBlock", () => {
      renderComponent();
      expect(screen.getByLabelText(/finish time/i)).toHaveValue("10:00");
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

    it("does not show the alert dialog initially", () => {
      renderComponent();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
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
        message: "",
        errors: { day: ["Please select a day"] },
        conflicts: [],
      });
      expect(screen.getByText("Please select a day")).toBeInTheDocument();
    });

    it("renders server-side subject errors", () => {
      renderComponent(defaultSettings, {
        message: "",
        errors: { subject: ["Subject is required"] },
        conflicts: [],
      });
      expect(screen.getByText("Subject is required")).toBeInTheDocument();
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

    it("renders a single conflict", () => {
      renderComponent(defaultSettings, {
        message: "",
        errors: {},
        conflicts: [
          {
            id: "c1",
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
            id: "c1",
            subject: "Physics",
            start_time: "09:00:00",
            end_time: "10:00:00",
          },
          {
            id: "c2",
            subject: "Chemistry",
            start_time: "09:30:00",
            end_time: "10:30:00",
          },
        ],
      });
      expect(screen.getByText(/Physics \(09:00 - 10:00\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/Chemistry \(09:30 - 10:30\)/),
      ).toBeInTheDocument();
    });
  });

  describe("client-side validation", () => {
    it("shows an error when subject is empty", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        subject: "",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/subject is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when subject is whitespace only", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        subject: "   ",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/subject is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when location is empty", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        location: "",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/location is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when end time is before start time", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        start_time: "10:00",
        end_time: "09:00",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
    });

    it("shows an error when end time equals start time", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        start_time: "09:00",
        end_time: "09:00",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
    });

    it("does not submit the form when validation fails", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        subject: "",
      });
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockFormAction).not.toHaveBeenCalled();
    });

    it("shows an error when start time is empty", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        start_time: "",
      });
      await user.clear(screen.getByLabelText(/start time/i));
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/start time is required/i),
      ).toBeInTheDocument();
    });

    it("shows an error when end time is empty", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        end_time: "",
      });
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
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        subject: "",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/subject is required/i),
      ).toBeInTheDocument();
      await user.type(screen.getByLabelText(/subject/i), "M");
      expect(
        screen.queryByText(/subject is required/i),
      ).not.toBeInTheDocument();
    });

    it("clears the location error when the location input changes", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        location: "",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/location is required/i),
      ).toBeInTheDocument();
      await user.type(screen.getByLabelText(/location/i), "R");
      expect(
        screen.queryByText(/location is required/i),
      ).not.toBeInTheDocument();
    });

    it("clears time errors when start_time input changes", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        start_time: "10:00",
        end_time: "09:00",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
      await user.clear(screen.getByLabelText(/start time/i));
      await user.type(screen.getByLabelText(/start time/i), "08:00");
      expect(
        screen.queryByText(/end time must be after start time/i),
      ).not.toBeInTheDocument();
    });

    it("clears the end_time error when end_time input changes", async () => {
      const user = userEvent.setup();
      renderComponent(defaultSettings, initialState, {
        ...defaultBlock,
        start_time: "10:00",
        end_time: "09:00",
      });
      await user.selectOptions(screen.getByRole("combobox"), "1");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText(/end time must be after start time/i),
      ).toBeInTheDocument();
      await user.clear(screen.getByLabelText(/finish time/i));
      await user.type(screen.getByLabelText(/finish time/i), "11:00");
      expect(
        screen.queryByText(/end time must be after start time/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("hidden-day AlertDialog", () => {
    it("shows the AlertDialog when a hidden day is selected with a valid form", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText(/saturday is hidden/i)).toBeInTheDocument();
    });

    it("does not show the AlertDialog for a visible day", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("calls unhideDow and submits when 'Yes, unhide it' is clicked", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: /yes, unhide it/i }));
      await waitFor(() =>
        expect(mockUnhideDow).toHaveBeenCalledWith("saturday"),
      );
      await waitFor(() =>
        expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalled(),
      );
    });

    it("submits without calling unhideDow when 'No, leave it hidden' is clicked", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await screen.findByRole("alertdialog");
      await user.click(
        screen.getByRole("button", { name: /no, leave it hidden/i }),
      );
      expect(mockUnhideDow).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalled(),
      );
    });

    it("closes the AlertDialog and does not submit when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
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
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });

    it("uses defaultDaySettings when the day key is missing from settings", async () => {
      const user = userEvent.setup();
      const settingsWithoutSaturday = { ...defaultSettings };
      delete settingsWithoutSaturday.saturday;
      renderComponent(settingsWithoutSaturday);
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });

    it("does not show the AlertDialog when a visible day is selected (defaultDaySettings true)", async () => {
      const user = userEvent.setup();
      const settingsWithoutMonday = { ...defaultSettings };
      delete settingsWithoutMonday.monday;
      renderComponent(settingsWithoutMonday);
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  describe("successful submission", () => {
    it("calls requestSubmit when a valid form is submitted for a visible day", async () => {
      const user = userEvent.setup();
      renderComponent();
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() =>
        expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalledTimes(
          1,
        ),
      );
    });

    it("calls requestSubmit after 'Yes, unhide it' is confirmed", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: /yes, unhide it/i }));
      await waitFor(() =>
        expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalledTimes(
          1,
        ),
      );
    });

    it("calls requestSubmit after 'No, leave it hidden' is confirmed", async () => {
      const user = userEvent.setup();
      renderComponent({ ...defaultSettings, saturday: "false" });
      await user.selectOptions(screen.getByRole("combobox"), "6");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await screen.findByRole("alertdialog");
      await user.click(
        screen.getByRole("button", { name: /no, leave it hidden/i }),
      );
      await waitFor(() =>
        expect(HTMLFormElement.prototype.requestSubmit).toHaveBeenCalledTimes(
          1,
        ),
      );
    });
  });
});
