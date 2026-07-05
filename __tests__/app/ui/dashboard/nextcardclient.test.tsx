import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";

jest.mock("@/lib/actions", () => ({
  fetchDashboardCard: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  LucideSkipForward: () => <svg data-testid="skip-forward-icon" />,
}));

import NextCardClient from "@/app/ui/dashboard/nextcardclient";

describe("NextCardClient", () => {
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
    render(<NextCardClient setId={setId} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("calls fetchDashboardCard with the next type, setId, day of week, and time", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:05").getTime());
    fetchDashboardCard.mockResolvedValue(null);

    await act(async () => {
      render(<NextCardClient setId={setId} />);
    });

    expect(fetchDashboardCard).toHaveBeenCalledWith(
      "next",
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
      render(<NextCardClient setId={setId} />);
    });

    expect(fetchDashboardCard).toHaveBeenCalledWith(
      "next",
      setId,
      7,
      expect.any(String),
    );
  });

  it("renders nothing when no user is found", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    fetchDashboardCard.mockResolvedValue({ reason: "no-user" });
    const { container } = render(<NextCardClient setId={setId} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no timetable set is found", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    fetchDashboardCard.mockResolvedValue({ reason: "no-set" });
    const { container } = render(<NextCardClient setId={setId} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing else today message", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    fetchDashboardCard.mockResolvedValue(null);
    await act(async () => {
      render(<NextCardClient setId={setId} />);
    });
    expect(
      screen.getByText("Looks like you're free for the rest of the day!"),
    ).toBeInTheDocument();
  });

  it("does not set up a refetch interval when there is no next block", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    fetchDashboardCard.mockResolvedValue(null);

    await act(async () => {
      render(<NextCardClient setId={setId} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(1);
  });

  it("renders next block info", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T09:00:00").getTime());
    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:00:00",
      end_time: "10:30:00",
    });
    await act(async () => {
      render(<NextCardClient setId={setId} />);
    });
    expect(screen.getByText(/Maths/)).toBeInTheDocument();
    expect(screen.getByText(/Room 314/)).toBeInTheDocument();
    expect(screen.getByText(/Finishes at 10:30/)).toBeInTheDocument();
  });

  it("does not refetch before the next block has started", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    await act(async () => {
      render(<NextCardClient setId={setId} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(1);
  });

  it("refetches when the next block has started", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());

    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    await act(async () => {
      render(<NextCardClient setId={setId} />);
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

    const { unmount } = render(<NextCardClient setId={setId} />);
    await act(async () => {});

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  describe("countdown text", () => {
    const renderWithStartTime = async (
      startTime: string,
      currentTime: string,
    ) => {
      const { fetchDashboardCard } = require("@/lib/actions");
      jest.setSystemTime(new Date(`2026-01-15T${currentTime}`).getTime());
      fetchDashboardCard.mockResolvedValue({
        subject: "Maths",
        location: "Room 314",
        start_time: startTime,
        end_time: startTime,
      });
      await act(async () => {
        render(<NextCardClient setId={setId} />);
      });
    };

    it("shows 'Starting in less than 1 minute' when minutesUntilNext is 0", async () => {
      await renderWithStartTime("10:30:00", "10:29:30");
      expect(
        screen.getByText(/Starting in less than 1 minute/),
      ).toBeInTheDocument();
    });

    it("shows 'Starting in 1 minute' when minutesUntilNext is 1", async () => {
      await renderWithStartTime("10:30:00", "10:28:30");
      expect(screen.getByText(/Starting in 1 minute/)).toBeInTheDocument();
    });

    it("shows 'Starting in X minutes' when minutesUntilNext is greater than 1", async () => {
      await renderWithStartTime("10:30:00", "10:25:00");
      expect(screen.getByText(/Starting in 4 minutes/)).toBeInTheDocument();
    });

    it("shows '1 hour and 0 minutes' when minutesUntilNext is exactly 60", async () => {
      await renderWithStartTime("11:01:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 1 hour and 0 minutes/),
      ).toBeInTheDocument();
    });

    it("shows singular minute when mins is 1", async () => {
      await renderWithStartTime("11:02:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 1 hour and 1 minute/),
      ).toBeInTheDocument();
    });

    it("shows hours and minutes when minutesUntilNext is 60 or more", async () => {
      await renderWithStartTime("11:30:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 1 hour and 29 minutes/),
      ).toBeInTheDocument();
    });

    it("shows '2 hours and 0 minutes' when minutesUntilNext is exactly 120", async () => {
      await renderWithStartTime("12:01:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 2 hours and 0 minutes/),
      ).toBeInTheDocument();
    });

    it("shows plural hours when minutesUntilNext is 120 or more", async () => {
      await renderWithStartTime("12:30:00", "10:00:00");
      expect(
        screen.getByText(/Starting in 2 hours and 29 minutes/),
      ).toBeInTheDocument();
    });
  });
});
