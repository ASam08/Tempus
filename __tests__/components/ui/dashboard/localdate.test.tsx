import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import LocalDateDisplay from "@/components/ui/dashboard/localdate";

describe("LocalDateDisplay", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "language", {
      value: "en-NZ",
      configurable: true,
    });
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-15").getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("displays the current date on render", () => {
    render(<LocalDateDisplay />);
    expect(screen.getByText("15/01/26")).toBeInTheDocument();
  });

  it("formats date according to the visitor locale", () => {
    Object.defineProperty(navigator, "language", {
      value: "en-US",
      configurable: true,
    });

    render(<LocalDateDisplay />);
    expect(screen.getByText("01/15/26")).toBeInTheDocument();
  });

  it("updates the date after 60 seconds", () => {
    render(<LocalDateDisplay />);

    // Advance time by 60 seconds and move to the next day
    act(() => {
      jest.setSystemTime(new Date("2026-01-16").getTime());
      jest.advanceTimersByTime(60000);
    });

    expect(screen.getByText("16/01/26")).toBeInTheDocument();
  });

  it("cleans up the interval on unmount", () => {
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<LocalDateDisplay />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
