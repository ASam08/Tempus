import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";

jest.mock("@/lib/actions", () => ({
  fetchNextBlock: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  LucideSkipForward: () => <svg data-testid="skip-forward-icon" />,
}));

import NextCardClient from "@/app/ui/dashboard/nextcardclient";

describe("NextCardClient", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders loading state", () => {
    const { fetchNextBlock } = require("@/lib/actions");
    fetchNextBlock.mockImplementation(() => new Promise(() => {}));
    render(<NextCardClient />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders nothing when no user is found", async () => {
    const { fetchNextBlock } = require("@/lib/actions");
    fetchNextBlock.mockResolvedValue({ reason: "no-user" });
    await act(async () => {
      render(<NextCardClient />);
    });
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(document.body.firstChild).toBeEmptyDOMElement();
  });

  it("renders nothing when no timetable set is found", async () => {
    const { fetchNextBlock } = require("@/lib/actions");
    fetchNextBlock.mockResolvedValue({ reason: "no-set" });
    await act(async () => {
      render(<NextCardClient />);
    });
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(document.body.firstChild).toBeEmptyDOMElement();
  });

  it("renders nothing else today message", async () => {
    const { fetchNextBlock } = require("@/lib/actions");
    fetchNextBlock.mockResolvedValue(null);
    await act(async () => {
      render(<NextCardClient />);
    });
    expect(
      screen.getByText("Looks like you're free for the rest of the day!"),
    ).toBeInTheDocument();
  });

  it("renders next block info", async () => {
    const { fetchNextBlock } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T09:00:00").getTime());
    fetchNextBlock.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:00:00",
      end_time: "10:30:00",
    });
    await act(async () => {
      render(<NextCardClient />);
    });
    expect(screen.getByText(/Maths/)).toBeInTheDocument();
    expect(screen.getByText(/Room 314/)).toBeInTheDocument();
    expect(screen.getByText(/Finishes at 10:30/)).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("refetches when block has started", async () => {
    const { fetchNextBlock } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());

    fetchNextBlock.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    await act(async () => {
      render(<NextCardClient />);
    });

    // Advance time past the block start
    await act(async () => {
      jest.setSystemTime(new Date("2026-01-15T10:31:00").getTime());
      jest.advanceTimersByTime(1000);
    });

    expect(fetchNextBlock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it("maps Sunday (JS day 0) to day 7 for the data call", async () => {
    const { fetchNextBlock } = require("@/lib/actions");
    jest.useFakeTimers();
    // 2026-01-18 is a Sunday
    jest.setSystemTime(new Date("2026-01-18T09:00:00").getTime());

    fetchNextBlock.mockResolvedValue(null);

    await act(async () => {
      render(<NextCardClient />);
    });

    // The important assertion: fetchNextBlock should have been called with 7, not 0
    expect(fetchNextBlock).toHaveBeenCalledWith(7, expect.any(String));

    jest.useRealTimers();
  });
});

describe("Next block countdown display", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithEndTime = async (endTime: string, currentTime: string) => {
    const { fetchNextBlock } = require("@/lib/actions");
    jest.setSystemTime(new Date(`2026-01-15T${currentTime}`).getTime());
    fetchNextBlock.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: endTime,
      end_time: endTime,
    });
    await act(async () => {
      render(<NextCardClient />);
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
