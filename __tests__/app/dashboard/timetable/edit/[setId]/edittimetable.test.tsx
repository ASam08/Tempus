import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

jest.mock("@/lib/data", () => ({
  checkTimetableSetOwnership: jest.fn(),
  getTimetableSetByID: jest.fn(),
}));

jest.mock("@/lib/actions", () => ({
  updateTimetableSet: jest.fn(),
}));

jest.mock("@/app/ui/timetable/edittimetableform", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="edit-timetable-form" />),
}));

import EditTimetablePage from "@/app/dashboard/timetable/edit/[setId]/page";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkTimetableSetOwnership, getTimetableSetByID } from "@/lib/data";
import { updateTimetableSet } from "@/lib/actions";
import EditTimetable from "@/app/ui/timetable/edittimetableform";

const mockedGetSession = auth.api.getSession as unknown as jest.Mock;
const mockedRedirect = redirect as unknown as jest.Mock;
const mockedCheckTimetableSetOwnership =
  checkTimetableSetOwnership as jest.Mock;
const mockedGetTimetableSetByID = getTimetableSetByID as jest.Mock;
const mockedEditTimetable = EditTimetable as jest.Mock;

const mockTimetable = {
  id: "set-1",
  title: "Semester One",
  description: "My weekly classes",
};
const mockParams = Promise.resolve({ setId: "set-1" });

function mockSession(userId: string | null) {
  mockedGetSession.mockResolvedValue(userId ? { user: { id: userId } } : null);
}

describe("EditTimetablePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    mockedGetTimetableSetByID.mockResolvedValue(mockTimetable);
  });

  it("redirects to login when there is no session", async () => {
    mockedGetSession.mockResolvedValue(null);
    await expect(EditTimetablePage({ params: mockParams })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when the session has no user", async () => {
    mockedGetSession.mockResolvedValue({});
    await expect(EditTimetablePage({ params: mockParams })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when the session user has no id", async () => {
    mockSession("");
    await expect(EditTimetablePage({ params: mockParams })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to the timetable list when the user does not own the set", async () => {
    mockSession("user-1");
    mockedCheckTimetableSetOwnership.mockResolvedValue(false);
    await expect(EditTimetablePage({ params: mockParams })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/timetable");
  });

  it("redirects to the timetable list when the timetable set is not found", async () => {
    mockSession("user-1");
    mockedGetTimetableSetByID.mockResolvedValue(null);
    await expect(EditTimetablePage({ params: mockParams })).rejects.toThrow();
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/timetable");
  });

  it("checks ownership using the resolved setId and user id", async () => {
    mockSession("user-1");
    await EditTimetablePage({ params: mockParams });
    expect(mockedCheckTimetableSetOwnership).toHaveBeenCalledWith(
      "set-1",
      "user-1",
    );
  });

  it("fetches the timetable set using the resolved setId and user id", async () => {
    mockSession("user-1");
    await EditTimetablePage({ params: mockParams });
    expect(mockedGetTimetableSetByID).toHaveBeenCalledWith("set-1", "user-1");
  });

  it("renders the EditTimetable form", async () => {
    mockSession("user-1");
    const jsx = await EditTimetablePage({ params: mockParams });
    render(jsx);
    expect(screen.getByTestId("edit-timetable-form")).toBeInTheDocument();
  });

  it("passes the fetched currentTimetable to EditTimetable", async () => {
    mockSession("user-1");
    const jsx = await EditTimetablePage({ params: mockParams });
    render(jsx);
    expect(mockedEditTimetable).toHaveBeenCalledWith(
      expect.objectContaining({ currentTimetable: mockTimetable }),
      undefined,
    );
  });

  it("passes a bound updateTimetableSet action to EditTimetable", async () => {
    mockSession("user-1");
    const jsx = await EditTimetablePage({ params: mockParams });
    render(jsx);
    const { action } = mockedEditTimetable.mock.calls[0][0];
    expect(typeof action).toBe("function");

    const formData = new FormData();
    action({}, formData);
    expect(updateTimetableSet).toHaveBeenCalledWith("set-1", {}, formData);
  });

  it("renders the wrapper div with expected classes", async () => {
    mockSession("user-1");
    const jsx = await EditTimetablePage({ params: mockParams });
    const { container } = render(jsx);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("h-full");
    expect(wrapper.className).toContain("max-w-2xl");
  });
});
