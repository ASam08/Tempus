import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";

jest.mock("@/lib/actions", () => ({
  fetchDashboardCard: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  LucidePause: () => <svg data-testid="pause-icon" />,
}));

import NextBreakCardClient from "@/app/ui/dashboard/nextbreakcardclient";

describe("NextBreakCardClient", () => {
  const setId = "test-set-id";

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders loading state", () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    fetchDashboardCard.mockImplementation(() => new Promise(() => {}));
    render(<NextBreakCardClient setId={setId} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("calls fetchDashboardCard with the next-break type, setId, day of week, and time", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:05").getTime());
    fetchDashboardCard.mockResolvedValue(null);

    await act(async () => {
      render(<NextBreakCardClient setId={setId} />);
    });

    expect(fetchDashboardCard).toHaveBeenCalledWith(
      "next-break",
      setId,
      4,
      "10:29:05",
    );
  });

  it("maps Sunday (JS day 0) to day 7 for the data call", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-18T09:00:00").getTime());
    fetchDashboardCard.mockResolvedValue(null);

    await act(async () => {
      render(<NextBreakCardClient setId={setId} />);
    });

    expect(fetchDashboardCard).toHaveBeenCalledWith(
      "next-break",
      setId,
      7,
      expect.any(String),
    );
  });

  it("renders nothing when no user is found", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    fetchDashboardCard.mockResolvedValue({ reason: "no-user" });
    const { container } = render(<NextBreakCardClient setId={setId} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no timetable set is found", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    fetchDashboardCard.mockResolvedValue({ reason: "no-set" });
    const { container } = render(<NextBreakCardClient setId={setId} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("renders currently on break message", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    fetchDashboardCard.mockResolvedValue(null);
    await act(async () => {
      render(<NextBreakCardClient setId={setId} />);
    });
    expect(
      screen.getByText("Looks like you're already on break!"),
    ).toBeInTheDocument();
  });

  it("does not set up a refetch interval when there is no next break", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    fetchDashboardCard.mockResolvedValue(null);

    await act(async () => {
      render(<NextBreakCardClient setId={setId} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(1);
  });

  it("renders next break info", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T09:00:00").getTime());
    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:00:00",
      end_time: "10:30:00",
    });
    await act(async () => {
      render(<NextBreakCardClient setId={setId} />);
    });
    expect(screen.getByText("Next Break")).toBeInTheDocument();
    expect(screen.getByText(/at 10:30/)).toBeInTheDocument();
  });

  it("does not refetch before the next break has started", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    await act(async () => {
      render(<NextBreakCardClient setId={setId} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(1);
  });

  it("refetches when the next break has started", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    await act(async () => {
      render(<NextBreakCardClient setId={setId} />);
    });

    await act(async () => {
      jest.setSystemTime(new Date("2026-01-15T10:31:00").getTime());
      jest.advanceTimersByTime(1000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(2);
  });

  it("clears the refetch interval on unmount", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    const { unmount } = render(<NextBreakCardClient setId={setId} />);
    await act(async () => {});

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  describe("countdown text", () => {
    const renderWithEndTime = async (endTime: string, currentTime: string) => {
      const { fetchDashboardCard } = require("@/lib/actions");
      jest.setSystemTime(new Date(`2026-01-15T${currentTime}`).getTime());
      fetchDashboardCard.mockResolvedValue({
        subject: "Maths",
        location: "Room 314",
        start_time: endTime,
        end_time: endTime,
      });
      await act(async () => {
        render(<NextBreakCardClient setId={setId} />);
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

    it("shows '1 hour and 0 minutes' when minutesUntilNext is exactly 60", async () => {
      await renderWithEndTime("11:01:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 1 hour and 0 minutes/),
      ).toBeInTheDocument();
    });

    it("shows singular minute when mins is 1", async () => {
      await renderWithEndTime("11:02:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 1 hour and 1 minute/),
      ).toBeInTheDocument();
    });

    it("shows hours and minutes when minutesUntilNext is 60 or more", async () => {
      await renderWithEndTime("11:30:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 1 hour and 29 minutes/),
      ).toBeInTheDocument();
    });

    it("shows '2 hours and 0 minutes' when minutesUntilNext is exactly 120", async () => {
      await renderWithEndTime("12:01:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 2 hours and 0 minutes/),
      ).toBeInTheDocument();
    });

    it("shows plural hours when minutesUntilNext is 120 or more", async () => {
      await renderWithEndTime("12:30:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 2 hours and 29 minutes/),
      ).toBeInTheDocument();
    });
  });
});
