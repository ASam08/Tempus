import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/data", () => ({
  __esModule: true,
  getUserID: jest.fn(),
  getUserSettings: jest.fn(),
}));

jest.mock("@/app/ui/settings/settings", () => ({
  __esModule: true,
  default: ({ settings }: { settings: unknown }) => (
    <div data-testid="settings-form" data-settings={JSON.stringify(settings)}>
      Settings Form
    </div>
  ),
}));

import SettingsPage from "@/app/dashboard/settings/page";

const mockedGetUserID = require("@/lib/data").getUserID;
const mockedGetUserSettings = require("@/lib/data").getUserSettings;

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders login message when user is not logged in", async () => {
    mockedGetUserID.mockResolvedValue(null);
    const result = await SettingsPage();
    render(result);
    expect(screen.getByText("You must be logged in")).toBeInTheDocument();
  });

  it("renders settings form when user is logged in", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetUserSettings.mockResolvedValue({ theme: "dark" });
    const result = await SettingsPage();
    render(result);
    expect(screen.getByText("Settings Form")).toBeInTheDocument();
  });

  it("handles missing settings gracefully", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetUserSettings.mockResolvedValue(null);
    const result = await SettingsPage();
    render(result);
    expect(screen.getByText("Settings Form")).toBeInTheDocument();
  });

  it("passes settings to the form", async () => {
    mockedGetUserID.mockResolvedValue("test-user-id");
    mockedGetUserSettings.mockResolvedValue({ theme: "dark" });
    const result = await SettingsPage();
    render(result);
    const form = screen.getByTestId("settings-form");
    expect(form).toHaveAttribute(
      "data-settings",
      JSON.stringify({ theme: "dark" }),
    );
  });
});
