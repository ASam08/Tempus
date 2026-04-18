import React from "react";
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

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  HoverCardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    id,
    name,
    defaultChecked,
  }: {
    id: string;
    name: string;
    defaultChecked: boolean;
  }) => (
    <input
      type="checkbox"
      id={id}
      name={name}
      defaultChecked={defaultChecked}
    />
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type,
    disabled,
    variant,
  }: {
    children: React.ReactNode;
    type?: "submit" | "button" | "reset";
    disabled?: boolean;
    variant?: string;
  }) => (
    <button type={type} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
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

jest.mock("lucide-react", () => ({
  LucideCircleQuestionMark: () => <div>LucideCircleQuestionMark</div>,
}));

jest.mock("@/lib/actions", () => ({
  settingsSave: jest.fn(),
}));

// Fix: added cn to prevent crashes if any real shadcn component leaks through,
// and kept dowDefault in the same mock (can't mock the same module twice)
jest.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
  dowDefault: jest.fn().mockReturnValue(false),
}));

jest.mock("@/lib/constants", () => ({
  dowKeyValue: [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ],
}));

jest.mock("@/lib/defaults", () => ({
  defaultTimeSettings: {
    start_time: "09:00",
    end_time: "17:00",
  },
}));

import SettingsFormClient from "@/app/ui/settings/settings";

const mockRefresh = jest.fn();

const setupMocks = (stateOverrides = {}) => {
  const { useActionState } = require("react");
  const { useRouter } = require("next/navigation");

  useRouter.mockReturnValue({ refresh: mockRefresh });
  // Fix: added explicit timestamp: undefined so the intent is clear and
  // toast tests that pass a real timestamp value signal a genuine state change
  useActionState.mockReturnValue([
    { message: null, errors: {}, timestamp: undefined, ...stateOverrides },
    jest.fn(),
  ]);
};

const getInputs = (container: HTMLElement) => ({
  start: container.querySelector("#start_time") as HTMLInputElement,
  end: container.querySelector("#end_time") as HTMLInputElement,
});

describe("SettingsFormClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<SettingsFormClient settings={null} />);
    });

    it("renders the form heading", () => {
      render(<SettingsFormClient settings={null} />);
      expect(screen.getByText("Update your settings")).toBeInTheDocument();
    });

    it("renders start and end time inputs", () => {
      const { container } = render(<SettingsFormClient settings={null} />);
      const { start, end } = getInputs(container);
      expect(start).toBeInTheDocument();
      expect(end).toBeInTheDocument();
    });

    it("renders Save and Cancel buttons", () => {
      render(<SettingsFormClient settings={null} />);
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Cancel" })).toBeInTheDocument();
    });

    it("Cancel link points to /dashboard/timetable", () => {
      render(<SettingsFormClient settings={null} />);
      expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
        "href",
        "/dashboard/timetable",
      );
    });

    it("renders a checkbox for each day of the week", () => {
      render(<SettingsFormClient settings={null} />);
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach(
        (day) => {
          expect(screen.getByText(day)).toBeInTheDocument();
        },
      );
    });
  });

  describe("default values", () => {
    it("uses default start and end times when settings is null", () => {
      const { container } = render(<SettingsFormClient settings={null} />);
      const { start, end } = getInputs(container);
      expect(start).toHaveValue("09:00");
      expect(end).toHaveValue("17:00");
    });

    it("uses provided settings values for start and end times", () => {
      const { container } = render(
        <SettingsFormClient
          settings={{ start_time: "08:00", end_time: "16:00" }}
        />,
      );
      const { start, end } = getInputs(container);
      expect(start).toHaveValue("08:00");
      expect(end).toHaveValue("16:00");
    });

    it("calls dowDefault for each day to determine checkbox state", () => {
      const { dowDefault } = require("@/lib/utils");
      render(<SettingsFormClient settings={null} />);
      // Fix: 7 days are defined in the mock, not 5
      expect(dowDefault).toHaveBeenCalledTimes(7);
    });
  });

  describe("time validation", () => {
    it("does not validate when start or end time is empty", () => {
      const { container } = render(
        <SettingsFormClient settings={{ start_time: "", end_time: "" }} />,
      );
      const { start } = getInputs(container);
      fireEvent.change(start, { target: { value: "10:00" } });
      // end is still empty — validateTimes should hit the early return
      expect(
        screen.queryByText("End time must be after start time"),
      ).not.toBeInTheDocument();
    });

    it("shows error when end time is before start time", () => {
      const { container } = render(<SettingsFormClient settings={null} />);
      const { start, end } = getInputs(container);
      fireEvent.change(start, { target: { value: "10:00" } });
      fireEvent.change(end, { target: { value: "09:00" } });
      expect(
        screen.getByText("End time must be after start time"),
      ).toBeInTheDocument();
    });

    it("shows error when end time equals start time", () => {
      const { container } = render(<SettingsFormClient settings={null} />);
      const { start, end } = getInputs(container);
      fireEvent.change(start, { target: { value: "10:00" } });
      fireEvent.change(end, { target: { value: "10:00" } });
      expect(
        screen.getByText("End time must be after start time"),
      ).toBeInTheDocument();
    });

    it("clears error when end time is corrected to be after start time", () => {
      const { container } = render(<SettingsFormClient settings={null} />);
      const { start, end } = getInputs(container);
      fireEvent.change(start, { target: { value: "10:00" } });
      fireEvent.change(end, { target: { value: "09:00" } });
      expect(
        screen.getByText("End time must be after start time"),
      ).toBeInTheDocument();
      fireEvent.change(end, { target: { value: "11:00" } });
      expect(
        screen.queryByText("End time must be after start time"),
      ).not.toBeInTheDocument();
    });

    it("disables Save button when there is a validation error", () => {
      const { container } = render(<SettingsFormClient settings={null} />);
      const { start, end } = getInputs(container);
      fireEvent.change(start, { target: { value: "10:00" } });
      fireEvent.change(end, { target: { value: "09:00" } });
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeDisabled();
    });

    it("enables Save button when times are valid", () => {
      const { container } = render(<SettingsFormClient settings={null} />);
      const { start, end } = getInputs(container);
      fireEvent.change(start, { target: { value: "10:00" } });
      fireEvent.change(end, { target: { value: "11:00" } });
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).not.toBeDisabled();
    });
  });

  describe("server action state", () => {
    it("shows success toast when state message is 'success'", async () => {
      const { useActionState } = require("react");
      const { toast } = require("sonner");
      useActionState.mockReturnValue([
        { message: "success", timestamp: 12345 },
        jest.fn(),
      ]);
      await act(async () => {
        render(<SettingsFormClient settings={null} />);
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Settings saved successfully!",
        expect.anything(),
      );
    });

    it("shows error toast when state message is a non-success error", async () => {
      const { useActionState } = require("react");
      const { toast } = require("sonner");
      useActionState.mockReturnValue([
        { message: "error", timestamp: 12345 },
        jest.fn(),
      ]);
      await act(async () => {
        render(<SettingsFormClient settings={null} />);
      });
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to save settings.",
        expect.anything(),
      );
    });

    it("calls router.refresh when state changes", async () => {
      const { useActionState } = require("react");
      useActionState.mockReturnValue([
        { message: "success", timestamp: 12345 },
        jest.fn(),
      ]);
      await act(async () => {
        render(<SettingsFormClient settings={null} />);
      });
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("does not show any toast when state message is null", async () => {
      const { toast } = require("sonner");
      await act(async () => {
        render(<SettingsFormClient settings={null} />);
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("renders server-side start_time field errors", () => {
      const { useActionState } = require("react");
      useActionState.mockReturnValue([
        {
          message: "error",
          errors: { start_time: ["Start time is required"] },
        },
        jest.fn(),
      ]);
      render(<SettingsFormClient settings={null} />);
      expect(screen.getByText("Start time is required")).toBeInTheDocument();
    });

    it("renders server-side end_time field errors", () => {
      const { useActionState } = require("react");
      useActionState.mockReturnValue([
        {
          message: "error",
          errors: { end_time: ["End time is invalid"] },
        },
        jest.fn(),
      ]);
      render(<SettingsFormClient settings={null} />);
      expect(screen.getByText("End time is invalid")).toBeInTheDocument();
    });
  });
});
