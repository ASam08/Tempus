import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";

jest.mock("@/lib/actions", () => ({
  fetchDashboardCard: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  LucidePlay: () => <svg data-testid="play-icon" />,
}));

import CurrentCardClient from "@/app/ui/dashboard/currentcardclient";

describe("CurrentCardClient", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders loading state", () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    const setId = "test-set-id";
    fetchDashboardCard.mockImplementation(() => new Promise(() => {}));
    render(<CurrentCardClient setId={setId} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("calls fetchDashboardCard with the current type, setId, day of week, and time", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T10:29:05").getTime());
    const setId = "test-set-id";
    fetchDashboardCard.mockResolvedValue(null);

    await act(async () => {
      render(<CurrentCardClient setId={setId} />);
    });

    expect(fetchDashboardCard).toHaveBeenCalledWith(
      "current",
      setId,
      4,
      "10:29:05",
    );
  });

  it("renders nothing when no user is found", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    const setId = "test-set-id";
    fetchDashboardCard.mockResolvedValue({ reason: "no-user" });
    const { container } = render(<CurrentCardClient setId={setId} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no timetable set is found", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    const setId = "test-set-id";
    fetchDashboardCard.mockResolvedValue({ reason: "no-set" });
    const { container } = render(<CurrentCardClient setId={setId} />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it("renders no current block message", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    const setId = "test-set-id";
    fetchDashboardCard.mockResolvedValue(null);
    await act(async () => {
      render(<CurrentCardClient setId={setId} />);
    });
    expect(screen.getByText("Nowhere to be right now!")).toBeInTheDocument();
  });

  it("renders current block info", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    const setId = "test-set-id";
    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      end_time: "14:30:00",
    });
    await act(async () => {
      render(<CurrentCardClient setId={setId} />);
    });
    expect(screen.getByText("Maths")).toBeInTheDocument();
    expect(screen.getByText("Room 314")).toBeInTheDocument();
    expect(screen.getByText("Finishes at 14:30")).toBeInTheDocument();
  });

  it("maps Sunday (JS day 0) to day 7 for the data call", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-18T09:00:00").getTime());

    fetchDashboardCard.mockResolvedValue(null);

    const setId = "test-set-id";
    await act(async () => {
      render(<CurrentCardClient setId={setId} />);
    });

    expect(fetchDashboardCard).toHaveBeenCalledWith(
      "current",
      setId,
      7,
      expect.any(String),
    );
  });

  it("does not refetch before the current block has ended", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());

    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      end_time: "10:30:00",
    });

    const setId = "test-set-id";
    await act(async () => {
      render(<CurrentCardClient setId={setId} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(1);
  });

  it("refetches when the current block has ended", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());

    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      start_time: "10:30:00",
      end_time: "10:30:00",
    });

    const setId = "test-set-id";
    await act(async () => {
      render(<CurrentCardClient setId={setId} />);
    });

    await act(async () => {
      jest.setSystemTime(new Date("2026-01-15T10:31:00").getTime());
      jest.advanceTimersByTime(1000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(2);
  });

  it("does not set up a refetch interval when there is no current block", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    fetchDashboardCard.mockResolvedValue(null);

    const setId = "test-set-id";
    await act(async () => {
      render(<CurrentCardClient setId={setId} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    expect(fetchDashboardCard).toHaveBeenCalledTimes(1);
  });

  it("clears the refetch interval on unmount", async () => {
    const { fetchDashboardCard } = require("@/lib/actions");
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15T10:29:00").getTime());
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    fetchDashboardCard.mockResolvedValue({
      subject: "Maths",
      location: "Room 314",
      end_time: "10:30:00",
    });

    const setId = "test-set-id";
    const { unmount } = render(<CurrentCardClient setId={setId} />);
    await act(async () => {});

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
