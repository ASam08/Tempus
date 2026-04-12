import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import LocalTimeDisplay from "@/components/ui/dashboard/localtime";

describe("LocalTimeDisplay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15").getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("displays the current time on render", () => {
    render(<LocalTimeDisplay />);
    const expected = new Date("2026-01-15").toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("updates the time after 1 second", () => {
    render(<LocalTimeDisplay />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const expected = new Date(
      new Date("2026-01-15").getTime() + 1000,
    ).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("cleans up the interval on unmount", () => {
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<LocalTimeDisplay />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
