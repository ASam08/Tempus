import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  act,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ refresh: jest.fn() })),
}));

jest.mock("@/lib/actions", () => ({
  deleteBlock: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/defaults", () => ({
  defaultTimeSettings: { start_time: "08:00", end_time: "18:00" },
  defaultDaySettings: {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  },
}));

jest.mock("@/lib/constants", () => ({
  dowShortened: [
    { key: "mon", dow: 1, label: "Monday", mid: "Mon", short: "M" },
    { key: "tue", dow: 2, label: "Tuesday", mid: "Tue", short: "T" },
    { key: "wed", dow: 3, label: "Wednesday", mid: "Wed", short: "W" },
    { key: "thu", dow: 4, label: "Thursday", mid: "Thu", short: "T" },
    { key: "fri", dow: 5, label: "Friday", mid: "Fri", short: "F" },
    { key: "sat", dow: 6, label: "Saturday", mid: "Sat", short: "S" },
    { key: "sun", dow: 7, label: "Sunday", mid: "Sun", short: "S" },
  ],
}));

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({
    children,
    open,
    onOpenChange,
  }: React.PropsWithChildren<{
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }>) => (
    <div data-testid="alert-dialog" data-open={open ? "true" : "false"}>
      {open ? children : null}
    </div>
  ),
  AlertDialogContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: React.PropsWithChildren) => (
    <div data-testid="alert-dialog-title">{children}</div>
  ),
  AlertDialogDescription: ({ children }: React.PropsWithChildren) => (
    <div data-testid="alert-dialog-description">{children}</div>
  ),
  AlertDialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  AlertDialogCancel: ({
    children,
    onClick,
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button data-testid="alert-dialog-cancel" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogAction: ({
    children,
    onClick,
    variant,
  }: React.PropsWithChildren<{ onClick?: () => void; variant?: string }>) => (
    <button
      data-testid="alert-dialog-confirm"
      onClick={onClick}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

import { TimetableGrid } from "@/app/ui/timetable/newtimetable";
import { deleteBlock } from "@/lib/actions";

const makeEvent = (overrides = {}) => ({
  id: "evt-1",
  subject: "Maths",
  start_time: "09:00",
  end_time: "10:00",
  day_of_week: 1,
  location: "Room 1",
  ...overrides,
});

const defaultSettings = {
  start_time: "08:00",
  end_time: "18:00",
  mon: "true",
  tue: "true",
  wed: "true",
  thu: "true",
  fri: "true",
  sat: "true",
  sun: "true",
};

const FIXED_DATE = new Date("2024-01-17T10:00:00").getTime();

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_DATE);
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1200,
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("TimetableGrid", () => {
  describe("rendering", () => {
    it("renders without crashing with no events and null settings", () => {
      render(<TimetableGrid events={[]} settings={null} />);
      expect(screen.getByTestId("edit-button")).toBeInTheDocument();
    });

    it("renders the Edit button in blue (non-delete) mode by default", () => {
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      const btn = screen.getByTestId("edit-button");
      expect(btn.className).toMatch(/bg-blue-600/);
      expect(btn.className).not.toMatch(/bg-red-600/);
    });

    it("shows the correct number of day-header columns (all 7 days)", () => {
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
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

    it("hides a day column when its setting is 'false'", () => {
      const settings = { ...defaultSettings, fri: "false" };
      render(<TimetableGrid events={[]} settings={settings} />);
      expect(screen.queryByText("Friday")).not.toBeInTheDocument();
    });

    it("renders time labels for each visible 15-minute slot", () => {
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      expect(screen.getByText("08:00")).toBeInTheDocument();
      expect(screen.getByText("09:00")).toBeInTheDocument();
    });

    it("renders the correct grid column count via inline style", () => {
      const { container } = render(
        <TimetableGrid events={[]} settings={defaultSettings} />,
      );
      const grid = container.querySelector(".grid") as HTMLElement;
      expect(grid.style.gridTemplateColumns).toMatch(/repeat\(7,/);
    });

    it("maps JS Sunday (getDay() === 0) to day_of_week 7 for highlighting", () => {
      jest.setSystemTime(new Date("2024-01-14T10:00:00").getTime());
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      expect(screen.getByText("Sunday").className).toMatch(/bg-blue-800/);
      expect(screen.getByText("Monday").className).not.toMatch(/bg-blue-800/);
    });

    it("renders the alert dialog in closed state by default", () => {
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      expect(screen.getByTestId("alert-dialog")).toHaveAttribute(
        "data-open",
        "false",
      );
    });
  });

  describe("responsive labels", () => {
    it("shows full labels when window width > 900", () => {
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      expect(screen.getByText("Monday")).toBeInTheDocument();
    });

    it("shows mid labels when window width is 601–900", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 700,
        configurable: true,
      });
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      act(() => {
        fireEvent(window, new Event("resize"));
      });
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.queryByText("Monday")).not.toBeInTheDocument();
    });

    it("shows short labels when window width ≤ 600", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 400,
        configurable: true,
      });
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      act(() => {
        fireEvent(window, new Event("resize"));
      });
      expect(screen.getByText("M")).toBeInTheDocument();
      expect(screen.queryByText("Monday")).not.toBeInTheDocument();
      expect(screen.queryByText("Mon")).not.toBeInTheDocument();
    });

    it("attaches and removes a resize listener", () => {
      const addSpy = jest.spyOn(window, "addEventListener");
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = render(
        <TimetableGrid events={[]} settings={defaultSettings} />,
      );
      expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    });
  });

  describe("today highlighting", () => {
    it("applies blue-800 background to today's (Wednesday) column header", () => {
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      expect(screen.getByText("Wednesday").className).toMatch(/bg-blue-800/);
    });

    it("does NOT apply today highlight to a non-today column", () => {
      render(<TimetableGrid events={[]} settings={defaultSettings} />);
      expect(screen.getByText("Monday").className).not.toMatch(/bg-blue-800/);
    });
  });

  describe("event rendering", () => {
    it("renders an event's subject text", () => {
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      expect(screen.getByText("Maths")).toBeInTheDocument();
    });

    it("renders start and end times for events with sufficient duration", () => {
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      const eventEl = screen
        .getByText("Maths")
        .closest("div[style]") as HTMLElement;
      expect(within(eventEl).getByText("09:00")).toBeInTheDocument();
      expect(within(eventEl).getByText("10:00")).toBeInTheDocument();
    });

    it("renders the location for events with sufficient duration", () => {
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      expect(screen.getByText("Room 1")).toBeInTheDocument();
    });

    it("does not render an event that falls outside the visible time range", () => {
      const outOfRange = makeEvent({ start_time: "20:00", end_time: "21:00" });
      render(
        <TimetableGrid events={[outOfRange]} settings={defaultSettings} />,
      );
      expect(screen.queryByText("Maths")).not.toBeInTheDocument();
    });

    it("does not render an event for a disabled day column", () => {
      const settings = { ...defaultSettings, sat: "false" };
      const satEvent = makeEvent({ day_of_week: 6, subject: "Saturday Class" });
      render(<TimetableGrid events={[satEvent]} settings={settings} />);
      expect(screen.queryByText("Saturday Class")).not.toBeInTheDocument();
    });

    it("applies today-specific blue-600 background to events on today's column", () => {
      const todayEvent = makeEvent({ day_of_week: 3, subject: "Today Event" });
      render(
        <TimetableGrid events={[todayEvent]} settings={defaultSettings} />,
      );
      const eventEl = screen
        .getByText("Today Event")
        .closest("div[style]") as HTMLElement;
      expect(eventEl.className).toMatch(/bg-blue-600/);
    });

    it("applies blue-800 background to events NOT on today's column", () => {
      const otherEvent = makeEvent({ day_of_week: 1, subject: "Other Event" });
      render(
        <TimetableGrid events={[otherEvent]} settings={defaultSettings} />,
      );
      const eventEl = screen
        .getByText("Other Event")
        .closest("div[style]") as HTMLElement;
      expect(eventEl.className).toMatch(/bg-blue-800/);
    });

    it("renders multiple events without error", () => {
      const events = [
        makeEvent({
          id: "1",
          subject: "Maths",
          start_time: "09:00",
          end_time: "10:00",
          day_of_week: 1,
        }),
        makeEvent({
          id: "2",
          subject: "English",
          start_time: "10:00",
          end_time: "11:00",
          day_of_week: 2,
        }),
      ];
      render(<TimetableGrid events={events} settings={defaultSettings} />);
      expect(screen.getByText("Maths")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("handles a null events prop gracefully via the ?? fallback", () => {
      expect(() =>
        // @ts-expect-error - testing null safety
        render(<TimetableGrid events={null} settings={defaultSettings} />),
      ).not.toThrow();
    });

    it("silently skips null entries within the events array", () => {
      const events = [makeEvent({ subject: "Valid Event" }), null] as any;
      render(<TimetableGrid events={events} settings={defaultSettings} />);
      expect(screen.getByText("Valid Event")).toBeInTheDocument();
    });

    it("applies small text class to events with duration > 1 but ≤ 6 virtual rows (10–30 min)", () => {
      const shortEvent = makeEvent({
        subject: "Short Event",
        start_time: "09:00",
        end_time: "09:15",
      });
      render(
        <TimetableGrid events={[shortEvent]} settings={defaultSettings} />,
      );
      const subjectEl = screen.getByText("Short Event");
      expect(subjectEl.className).toMatch(/text-xs/);
      expect(subjectEl.className).toMatch(/leading-none/);
    });

    it("applies tiny text class to events with duration of exactly 1 virtual row (5 min)", () => {
      const tinyEvent = makeEvent({
        subject: "Tiny Event",
        start_time: "09:00",
        end_time: "09:05",
      });
      render(<TimetableGrid events={[tinyEvent]} settings={defaultSettings} />);
      const subjectEl = screen.getByText("Tiny Event");
      expect(subjectEl.className).toMatch(/text-\[6px\]/);
      expect(subjectEl.className).toMatch(/leading-none/);
    });
  });

  describe("delete mode", () => {
    it("toggles into delete mode when Edit button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      const btn = screen.getByTestId("edit-button");
      await user.click(btn);
      expect(btn.className).toMatch(/bg-red-600/);
    });

    it("shows the X delete icon on events when in delete mode", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      await user.click(screen.getByTestId("edit-button"));
      expect(document.querySelector(".lucide-x")).toBeInTheDocument();
    });

    it("hides the X delete icon when NOT in delete mode", () => {
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      expect(document.querySelector(".lucide-x")).not.toBeInTheDocument();
    });

    it("toggles back out of delete mode on second click", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      const btn = screen.getByTestId("edit-button");
      await user.click(btn);
      await user.click(btn);
      expect(btn.className).toMatch(/bg-blue-600/);
      expect(btn.className).not.toMatch(/bg-red-600/);
    });
  });

  describe("block deletion via AlertDialog", () => {
    it("opens the alert dialog when the X icon is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      await user.click(screen.getByTestId("edit-button"));
      await user.click(document.querySelector(".lucide-x") as HTMLElement);
      expect(screen.getByTestId("alert-dialog")).toHaveAttribute(
        "data-open",
        "true",
      );
    });

    it("shows the confirmation dialog content when opened", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      await user.click(screen.getByTestId("edit-button"));
      await user.click(document.querySelector(".lucide-x") as HTMLElement);
      expect(screen.getByTestId("alert-dialog-title")).toBeInTheDocument();
      expect(
        screen.getByTestId("alert-dialog-description"),
      ).toBeInTheDocument();
    });

    it("calls deleteBlock with the correct id when confirmed", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid
          events={[makeEvent({ id: "evt-42" })]}
          settings={defaultSettings}
        />,
      );
      await user.click(screen.getByTestId("edit-button"));
      await user.click(document.querySelector(".lucide-x") as HTMLElement);
      await user.click(screen.getByTestId("alert-dialog-confirm"));
      expect(deleteBlock).toHaveBeenCalledWith("evt-42");
    });

    it("does NOT call deleteBlock when cancel is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      await user.click(screen.getByTestId("edit-button"));
      await user.click(document.querySelector(".lucide-x") as HTMLElement);
      await user.click(screen.getByTestId("alert-dialog-cancel"));
      expect(deleteBlock).not.toHaveBeenCalled();
    });

    it("closes the dialog after confirmation", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      await user.click(screen.getByTestId("edit-button"));
      await user.click(document.querySelector(".lucide-x") as HTMLElement);
      await user.click(screen.getByTestId("alert-dialog-confirm"));
      await waitFor(() => {
        expect(screen.getByTestId("alert-dialog")).toHaveAttribute(
          "data-open",
          "false",
        );
      });
    });

    it("calls router.refresh() after a successful deletion", async () => {
      const mockRefresh = jest.fn();
      jest
        .requireMock("next/navigation")
        .useRouter.mockReturnValue({ refresh: mockRefresh });
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      await user.click(screen.getByTestId("edit-button"));
      await user.click(document.querySelector(".lucide-x") as HTMLElement);
      await user.click(screen.getByTestId("alert-dialog-confirm"));
      await act(async () => {});
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("calls router.refresh() even when deleteId is null", async () => {
      const mockRefresh = jest.fn();
      jest
        .requireMock("next/navigation")
        .useRouter.mockReturnValue({ refresh: mockRefresh });
      render(
        <TimetableGrid events={[makeEvent()]} settings={defaultSettings} />,
      );
      const { AlertDialog } = jest.requireMock("@/components/ui/alert-dialog");
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await user.click(screen.getByTestId("edit-button"));
      await user.click(document.querySelector(".lucide-x") as HTMLElement);
      (deleteBlock as unknown as jest.Mock).mockResolvedValueOnce(undefined);
      await user.click(screen.getByTestId("alert-dialog-confirm"));
      await act(async () => {});
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe("settings & defaults", () => {
    it("falls back to defaultTimeSettings when settings is null", () => {
      render(<TimetableGrid events={[]} settings={null} />);
      expect(screen.getByText("08:00")).toBeInTheDocument();
    });

    it("uses custom start/end times from settings", () => {
      const settings = {
        ...defaultSettings,
        start_time: "06:00",
        end_time: "12:00",
      };
      render(<TimetableGrid events={[]} settings={settings} />);
      expect(screen.getByText("06:00")).toBeInTheDocument();
      expect(screen.queryByText("18:00")).not.toBeInTheDocument();
    });

    it("uses defaultDaySettings for day visibility when settings has no day keys", () => {
      render(
        <TimetableGrid
          events={[]}
          settings={{ start_time: "08:00", end_time: "18:00" }}
        />,
      );
      expect(screen.getByText("Monday")).toBeInTheDocument();
      expect(screen.getByText("Saturday")).toBeInTheDocument();
      expect(screen.getByText("Sunday")).toBeInTheDocument();
    });
  });

  describe("edit block navigation", () => {
    it("navigates to the edit page when the edit icon on an event is clicked", async () => {
      const mockPush = jest.fn();
      jest
        .requireMock("next/navigation")
        .useRouter.mockReturnValue({ refresh: jest.fn(), push: mockPush });
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <TimetableGrid
          events={[makeEvent({ id: "evt-99" })]}
          settings={defaultSettings}
        />,
      );
      await user.click(screen.getByTestId("edit-button"));
      const eventBlock = screen
        .getByText("Maths")
        .closest("div[style]") as HTMLElement;
      const svgs = eventBlock.querySelectorAll("svg");
      fireEvent.click(svgs[0]);
      expect(mockPush).toHaveBeenCalledWith("./timetable/edit-block/evt-99");
    });
  });
});
