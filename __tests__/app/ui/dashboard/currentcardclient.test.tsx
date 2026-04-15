import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";

jest.mock("@/lib/actions", () => ({
  fetchCurrentBlock: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  LucidePlay: () => <svg data-testid="play-icon" />,
}));

import CurrentCardClient from "@/app/ui/dashboard/currentcardclient";

describe("CurrentCardClient", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders loading state", () => {
    const { fetchCurrentBlock } = require("@/lib/actions");
    fetchCurrentBlock.mockImplementation(() => new Promise(() => {}));
    render(<CurrentCardClient />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders no user message", async () => {
    const { fetchCurrentBlock } = require("@/lib/actions");
    fetchCurrentBlock.mockResolvedValue({ reason: "no-user" });
    await act(async () => {
      render(<CurrentCardClient />);
    });
    expect(
      screen.getByText("Nothing to see here, add a timetable to get started!"),
    ).toBeInTheDocument();
  });

  it("renders no timetable set message", async () => {
    const { fetchCurrentBlock } = require("@/lib/actions");
    fetchCurrentBlock.mockResolvedValue({ reason: "no-set" });
    await act(async () => {
      render(<CurrentCardClient />);
    });
    expect(
      screen.getByText("Nothing to see here, add a timetable to get started!"),
    ).toBeInTheDocument();
  });

  it("renders no current block message", async () => {
    const { fetchCurrentBlock } = require("@/lib/actions");
    fetchCurrentBlock.mockResolvedValue(null);
    await act(async () => {
      render(<CurrentCardClient />);
    });
    expect(screen.getByText("Nowhere to be right now!")).toBeInTheDocument();
  });

  it("renders current block info", async () => {
    const { fetchCurrentBlock } = require("@/lib/actions");
    fetchCurrentBlock.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      end_time: "14:30:00",
    });
    await act(async () => {
      render(<CurrentCardClient />);
    });
    expect(screen.getByText("Maths")).toBeInTheDocument();
    expect(screen.getByText("Room 314")).toBeInTheDocument();
    expect(screen.getByText("Finishes at 14:30")).toBeInTheDocument();
  });

  it("refetches when block has started", async () => {
    const { fetchCurrentBlock } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());

    fetchCurrentBlock.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    await act(async () => {
      render(<CurrentCardClient />);
    });

    // Advance time past the block start
    await act(async () => {
      jest.setSystemTime(new Date("2026-01-15T10:31:00").getTime());
      jest.advanceTimersByTime(1000);
    });

    expect(fetchCurrentBlock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it("maps Sunday (JS day 0) to day 7 for the data call", async () => {
    const { fetchCurrentBlock } = require("@/lib/actions");
    jest.useFakeTimers();
    // 2026-01-18 is a Sunday
    jest.setSystemTime(new Date("2026-01-18T09:00:00").getTime());

    fetchCurrentBlock.mockResolvedValue(null);

    await act(async () => {
      render(<CurrentCardClient />);
    });

    // The important assertion: fetchCurrentBlock should have been called with 7, not 0
    expect(fetchCurrentBlock).toHaveBeenCalledWith(7, expect.any(String));

    jest.useRealTimers();
  });
});
