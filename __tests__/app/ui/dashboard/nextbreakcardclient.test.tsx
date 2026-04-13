import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";

jest.mock("@/lib/actions", () => ({
  fetchNextBreak: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  LucidePause: () => <svg data-testid="pause-icon" />,
}));

import NextBreakCardClient from "@/app/ui/dashboard/nextbreakcardclient";

describe("NextBreakCardClient", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders loading state", () => {
    const { fetchNextBreak } = require("@/lib/actions");
    fetchNextBreak.mockImplementation(() => new Promise(() => {}));
    render(<NextBreakCardClient />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders nothing when no user is found", async () => {
    const { fetchNextBreak } = require("@/lib/actions");
    fetchNextBreak.mockResolvedValue({ reason: "no-user" });
    await act(async () => {
      render(<NextBreakCardClient />);
    });
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(document.body.firstChild).toBeEmptyDOMElement();
  });

  it("renders currently on break message", async () => {
    const { fetchNextBreak } = require("@/lib/actions");
    fetchNextBreak.mockResolvedValue(null);
    await act(async () => {
      render(<NextBreakCardClient />);
    });
    expect(
      screen.getByText("Looks like you're already on break!"),
    ).toBeInTheDocument();
  });

  it("renders next break info", async () => {
    const { fetchNextBreak } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T09:00:00").getTime());
    fetchNextBreak.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:00:00",
      end_time: "10:30:00",
    });
    await act(async () => {
      render(<NextBreakCardClient />);
    });
    expect(screen.getByText("Next Break")).toBeInTheDocument();
    expect(screen.getByText(/at 10:30/)).toBeInTheDocument();
    jest.useRealTimers();
  });
});

describe("Next break countdown display", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithEndTime = async (endTime: string, currentTime: string) => {
    const { fetchNextBreak } = require("@/lib/actions");
    jest.setSystemTime(new Date(`2026-01-15T${currentTime}`).getTime());
    fetchNextBreak.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: endTime,
      end_time: endTime,
    });
    await act(async () => {
      render(<NextBreakCardClient />);
    });
  };

  it("shows 'Starting in less than 1 minute' when minutesUntilNext is 0", async () => {
    await renderWithEndTime("10:30:00", "10:29:30");
    expect(
      screen.getByText(/Starting in less than 1 minute/),
    ).toBeInTheDocument();
  });

  it("shows 'Starting in 1 minute' when minutesUntilNext is 1", async () => {
    await renderWithEndTime("10:30:00", "10:28:30");
    expect(screen.getByText(/Starting in 1 minute/)).toBeInTheDocument();
  });

  it("shows 'Starting in X minutes' when minutesUntilNext is greater than 1", async () => {
    await renderWithEndTime("10:30:00", "10:25:00");
    expect(screen.getByText(/Starting in 4 minutes/)).toBeInTheDocument();
  });

  it("shows hours and minutes when minutesUntilNext is 60 or more", async () => {
    await renderWithEndTime("11:30:00", "10:00:00");
    expect(
      screen.getByText(/Starting in 1 hour and 29 minutes/),
    ).toBeInTheDocument();
  });

  it("shows plural hours when minutesUntilNext is 120 or more", async () => {
    await renderWithEndTime("12:30:00", "10:00:00");
    expect(
      screen.getByText(/Starting in 2 hours and 29 minutes/),
    ).toBeInTheDocument();
  });

  it("shows singular minute when mins is 1", async () => {
    await renderWithEndTime("11:02:00", "10:00:00");
    expect(
      screen.getByText(/Starting in 1 hour and 1 minute/),
    ).toBeInTheDocument();
  });
});
