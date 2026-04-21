/**
 * TimetableGrid.test.tsx
 *
 * Run with: npx jest TimetableGrid.test.tsx
 * Requires: jest, @testing-library/react, @testing-library/jest-dom,
 *           @testing-library/user-event, jest-environment-jsdom
 */

import React from "react";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
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

// Mock Button so we don't need the full shadcn/ui dependency tree
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
  }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
    <button onClick={onClick} className={className} data-testid="edit-button">
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
  day_of_week: 1, // Monday
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

// Pin "today" to a Wednesday (day_of_week = 3) so tests are deterministic
const FIXED_DATE = new Date("2024-01-17T10:00:00").getTime(); // Wednesday

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_DATE);
  // Default window width — triggers "full label" path (> 900px)
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

describe("TimetableGrid – rendering", () => {
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
    // 08:00 and 09:00 should always be present as bold hour labels
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
  });

  it("renders the correct grid column count via inline style", () => {
    const { container } = render(
      <TimetableGrid events={[]} settings={defaultSettings} />,
    );
    const grid = container.querySelector(".grid") as HTMLElement;
    // 7 visible days → "60px repeat(7, …)"
    expect(grid.style.gridTemplateColumns).toMatch(/repeat\(7,/);
  });

  it("maps JS Sunday (getDay() === 0) to day_of_week 7 for highlighting", () => {
    // JS Date.getDay() returns 0 for Sunday; the component must remap it to 7
    jest.setSystemTime(new Date("2024-01-14T10:00:00").getTime()); // a Sunday
    render(<TimetableGrid events={[]} settings={defaultSettings} />);
    expect(screen.getByText("Sunday").className).toMatch(/bg-blue-800/);
    expect(screen.getByText("Monday").className).not.toMatch(/bg-blue-800/);
  });
});

describe("TimetableGrid – responsive labels", () => {
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
    // Trigger resize
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
    expect(screen.getByText("M")).toBeInTheDocument(); // Monday short
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

describe("TimetableGrid – today highlighting", () => {
  it("applies blue-800 background to today's (Wednesday) column header", () => {
    render(<TimetableGrid events={[]} settings={defaultSettings} />);
    const wedHeader = screen.getByText("Wednesday");
    // The "today" column receives bg-blue-800 while others receive bg-slate-300
    expect(wedHeader.className).toMatch(/bg-blue-800/);
  });

  it("does NOT apply today highlight to a non-today column", () => {
    render(<TimetableGrid events={[]} settings={defaultSettings} />);
    const monHeader = screen.getByText("Monday");
    expect(monHeader.className).not.toMatch(/bg-blue-800/);
  });
});

describe("TimetableGrid – event rendering", () => {
  it("renders an event's subject text", () => {
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);
    expect(screen.getByText("Maths")).toBeInTheDocument();
  });

  it("renders start and end times for events with sufficient duration", () => {
    // A 60-minute event spans 12 virtual rows (60/5), well above the duration>6 threshold
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);
    const eventEl = screen
      .getByText("Maths")
      .closest("div[style]") as HTMLElement;
    expect(within(eventEl).getByText("09:00")).toBeInTheDocument();
    expect(within(eventEl).getByText("10:00")).toBeInTheDocument();
  });

  it("renders the location for events with sufficient duration", () => {
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);
    expect(screen.getByText("Room 1")).toBeInTheDocument();
  });

  it("does not render an event that falls outside the visible time range", () => {
    const outOfRange = makeEvent({ start_time: "20:00", end_time: "21:00" });
    render(<TimetableGrid events={[outOfRange]} settings={defaultSettings} />);
    expect(screen.queryByText("Maths")).not.toBeInTheDocument();
  });

  it("does not render an event for a disabled day column", () => {
    const settings = { ...defaultSettings, sat: "false" };
    const satEvent = makeEvent({ day_of_week: 6, subject: "Saturday Class" });
    render(<TimetableGrid events={[satEvent]} settings={settings} />);
    expect(screen.queryByText("Saturday Class")).not.toBeInTheDocument();
  });

  it("applies today-specific blue-600 background to events on today's column", () => {
    // Wednesday is today (FIXED_DATE); day_of_week=3
    const todayEvent = makeEvent({ day_of_week: 3, subject: "Today Event" });
    render(<TimetableGrid events={[todayEvent]} settings={defaultSettings} />);
    const eventEl = screen
      .getByText("Today Event")
      .closest("div[style]") as HTMLElement;
    expect(eventEl.className).toMatch(/bg-blue-600/);
  });

  it("applies blue-800 background to events NOT on today's column", () => {
    const otherEvent = makeEvent({ day_of_week: 1, subject: "Other Event" }); // Monday
    render(<TimetableGrid events={[otherEvent]} settings={defaultSettings} />);
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
      // @ts-expect-error - events can be null, but this tests that the component doesn't throw in that case
      render(<TimetableGrid events={null} settings={defaultSettings} />),
    ).not.toThrow();
  });

  it("silently skips null entries within the events array", () => {
    // Exercises the filter(Boolean) branch — null slots are stripped without throwing
    const events = [makeEvent({ subject: "Valid Event" }), null] as any;
    render(<TimetableGrid events={events} settings={defaultSettings} />);
    expect(screen.getByText("Valid Event")).toBeInTheDocument();
  });

  it("applies small text class to events with duration > 1 but ≤ 6 virtual rows (10–30 min)", () => {
    // 15 min = 3 virtual rows (3 × 5 min): hits the `duration > 1` branch
    const shortEvent = makeEvent({
      subject: "Short Event",
      start_time: "09:00",
      end_time: "09:15",
    });
    render(<TimetableGrid events={[shortEvent]} settings={defaultSettings} />);
    const subjectEl = screen.getByText("Short Event");
    expect(subjectEl.className).toMatch(/text-xs/);
    expect(subjectEl.className).toMatch(/leading-none/);
  });

  it("applies tiny text class to events with duration of exactly 1 virtual row (5 min)", () => {
    // 5 min = 1 virtual row: hits the final `text-[6px]` branch
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

describe("TimetableGrid – delete mode", () => {
  it("toggles into delete mode when Edit button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);
    const btn = screen.getByTestId("edit-button");
    await user.click(btn);
    expect(btn.className).toMatch(/bg-red-600/);
  });

  it("shows the X delete icon on events when in delete mode", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);
    await user.click(screen.getByTestId("edit-button"));
    // lucide renders an svg; check that the close icon container is present
    expect(document.querySelector(".lucide-x")).toBeInTheDocument();
  });

  it("hides the X delete icon when NOT in delete mode", () => {
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);
    expect(document.querySelector(".lucide-x")).not.toBeInTheDocument();
  });

  it("toggles back out of delete mode on second click", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);
    const btn = screen.getByTestId("edit-button");
    await user.click(btn); // enter
    await user.click(btn); // exit
    expect(btn.className).toMatch(/bg-blue-600/);
    expect(btn.className).not.toMatch(/bg-red-600/);
  });
});

describe("TimetableGrid – block deletion", () => {
  it("calls deleteBlock with the correct id when confirmed", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <TimetableGrid
        events={[makeEvent({ id: "evt-42" })]}
        settings={defaultSettings}
      />,
    );

    // Enter delete mode
    await user.click(screen.getByTestId("edit-button"));

    // Click the X icon
    const xIcon = document.querySelector(".lucide-x") as HTMLElement;
    await user.click(xIcon);

    expect(deleteBlock).toHaveBeenCalledWith("evt-42");
  });

  it("does NOT call deleteBlock when user cancels the confirm dialog", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);

    await user.click(screen.getByTestId("edit-button"));
    const xIcon = document.querySelector(".lucide-x") as HTMLElement;
    await user.click(xIcon);

    expect(deleteBlock).not.toHaveBeenCalled();
  });

  it("calls router.refresh() after a successful deletion", async () => {
    const mockRefresh = jest.fn();
    jest
      .requireMock("next/navigation")
      .useRouter.mockReturnValue({ refresh: mockRefresh });
    jest.spyOn(window, "confirm").mockReturnValue(true);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TimetableGrid events={[makeEvent()]} settings={defaultSettings} />);

    await user.click(screen.getByTestId("edit-button"));
    await user.click(document.querySelector(".lucide-x") as HTMLElement);

    // deleteBlock is async — flush promises
    await act(async () => {});
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("TimetableGrid – settings & defaults", () => {
  it("falls back to defaultTimeSettings when settings is null", () => {
    // Should not throw; grid renders with 08:00–18:00 range
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
