import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("@/lib/data", () => ({
  getUserID: jest.fn(),
  getTimetableSets: jest.fn(),
  getTimetableBlocks: jest.fn(),
  getUserSettings: jest.fn(),
}));

jest.mock("@/app/ui/timetable/newtimetable", () => ({
  TimetableGrid: ({
    events,
    settings,
  }: {
    events: unknown[];
    settings: unknown;
  }) => (
    <div data-testid="timetable-grid">
      <span data-testid="events-count">{(events as unknown[]).length}</span>
      <span data-testid="settings-value">
        {settings ? "has-settings" : "no-settings"}
      </span>
    </div>
  ),
}));

jest.mock("next/link", () => {
  const Link = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>;
  Link.displayName = "Link";
  return Link;
});

jest.mock(
  "@/components/ui/button",
  () => require("@/testing/mocks/shadcn").buttonMock,
);

jest.mock("lucide-react", () => ({
  LucideGrid2X2Plus: () => <svg data-testid="lucide-icon" />,
}));

import TimetableGridServer from "@/app/ui/timetable/timetablegridserver";
import {
  getUserID,
  getTimetableSets,
  getTimetableBlocks,
  getUserSettings,
} from "@/lib/data";

const mockGetUserID = jest.mocked(getUserID);
const mockGetTimetableSets = jest.mocked(getTimetableSets);
const mockGetTimetableBlocks = jest.mocked(getTimetableBlocks);
const mockGetUserSettings = jest.mocked(getUserSettings);

const expectCreateTimetableUI = () => {
  expect(
    screen.getByText(/you haven't created a timetable yet/i),
  ).toBeInTheDocument();
  const link = screen.getByRole("link", { name: /create new timetable/i });
  expect(link).toHaveAttribute("href", "./timetable/new-timetable");
};

describe("TimetableGridServer", () => {
  beforeEach(() => {
    mockGetUserID.mockReset();
    mockGetTimetableSets.mockReset();
    mockGetTimetableBlocks.mockReset();
    mockGetUserSettings.mockReset();
  });

  describe("when user ID is not found", () => {
    it("renders the create timetable prompt", async () => {
      mockGetUserID.mockResolvedValue(null);

      render(await TimetableGridServer());

      await waitFor(() => expectCreateTimetableUI());
    });
  });

  describe("when user has no timetable sets", () => {
    it("renders the create timetable prompt when sets is empty array", async () => {
      mockGetUserID.mockResolvedValue("user123");
      mockGetTimetableSets.mockResolvedValue([]);

      render(await TimetableGridServer());

      await waitFor(() => expectCreateTimetableUI());
    });

    it("renders the create timetable prompt when sets is null", async () => {
      mockGetUserID.mockResolvedValue("user123");
      mockGetTimetableSets.mockResolvedValue(null as any);

      render(await TimetableGridServer());

      await waitFor(() => expectCreateTimetableUI());
    });
  });

  describe("when user has timetable sets", () => {
    it("renders TimetableGrid with events and settings", async () => {
      mockGetUserID.mockResolvedValue("user123");
      mockGetTimetableSets.mockResolvedValue([{ id: "set1" }]);
      mockGetTimetableBlocks.mockResolvedValue([
        {
          id: "block1",
          subject: "Maths",
          location: "Room 1",
          start_time: "09:00",
          end_time: "10:00",
          day_of_week: 1,
        },
      ]);
      mockGetUserSettings.mockResolvedValue({ start_time: "08:30" });

      render(await TimetableGridServer());

      await waitFor(() => {
        expect(screen.getByTestId("timetable-grid")).toBeInTheDocument();
        expect(screen.getByTestId("events-count")).toHaveTextContent("1");
        expect(screen.getByTestId("settings-value")).toHaveTextContent(
          "has-settings",
        );
      });
    });

    it("renders TimetableGrid with empty events when blocks returns null", async () => {
      mockGetUserID.mockResolvedValue("user123");
      mockGetTimetableSets.mockResolvedValue([{ id: "set1" }]);
      mockGetTimetableBlocks.mockResolvedValue(null as any);
      mockGetUserSettings.mockResolvedValue({ start_time: "08:30" });

      render(await TimetableGridServer());

      await waitFor(() => {
        expect(screen.getByTestId("timetable-grid")).toBeInTheDocument();
        expect(screen.getByTestId("events-count")).toHaveTextContent("0");
      });
    });

    it("renders TimetableGrid with null settings when getUserSettings returns null", async () => {
      mockGetUserID.mockResolvedValue("user123");
      mockGetTimetableSets.mockResolvedValue([{ id: "set1" }]);
      mockGetTimetableBlocks.mockResolvedValue([
        {
          id: "block1",
          subject: "Maths",
          location: "Room 1",
          start_time: "09:00",
          end_time: "10:00",
          day_of_week: 1,
        },
      ]);
      mockGetUserSettings.mockResolvedValue(null);

      render(await TimetableGridServer());

      await waitFor(() => {
        expect(screen.getByTestId("timetable-grid")).toBeInTheDocument();
        expect(screen.getByTestId("settings-value")).toHaveTextContent(
          "no-settings",
        );
      });
    });
  });
});
