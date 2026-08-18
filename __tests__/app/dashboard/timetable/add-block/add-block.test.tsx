import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

type AddTimetableBlockProps = {
  settings: unknown;
  action: (prevState: unknown, formData: FormData) => unknown;
  subjectList: string[];
};

const mockAddTimetableBlockComponent = jest.fn(
  ({ settings }: AddTimetableBlockProps) => (
    <div data-testid="add-block-form" data-settings={JSON.stringify(settings)}>
      Add Block Form
    </div>
  ),
);

jest.mock("@/lib/data", () => ({
  __esModule: true,
  getUserID: jest.fn(),
  getUserSettings: jest.fn(),
  checkTimetableSetOwnership: jest.fn(),
  getUniqueSubjects: jest.fn(),
}));

jest.mock("@/lib/actions", () => ({
  __esModule: true,
  addTimetableBlock: jest.fn(),
}));

jest.mock("@/app/ui/timetable/addtimetableblock", () => ({
  __esModule: true,
  default: (props: AddTimetableBlockProps) =>
    mockAddTimetableBlockComponent(props),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import AddBlockPage from "@/app/dashboard/timetable/add-block/page";
import {
  getUserID,
  getUserSettings,
  checkTimetableSetOwnership,
  getUniqueSubjects,
} from "@/lib/data";
import { addTimetableBlock } from "@/lib/actions";
import { redirect } from "next/navigation";

const mockedGetUserID = getUserID as jest.Mock;
const mockedGetUserSettings = getUserSettings as jest.Mock;
const mockedCheckTimetableSetOwnership =
  checkTimetableSetOwnership as jest.Mock;
const mockedGetUniqueSubjects = getUniqueSubjects as jest.Mock;
const mockedAddTimetableBlock = addTimetableBlock as jest.Mock;
const mockedRedirect = redirect as any as jest.Mock;
const mockSubjectList = ["Maths", "English", "Science"];

describe("AddBlockPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRedirect.mockImplementation(() => {
      throw new Error("REDIRECT");
    });
    mockedGetUserSettings.mockResolvedValue(null);
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    mockedGetUniqueSubjects.mockResolvedValue(mockSubjectList);
  });

  it("redirects to timetable when setId is missing", async () => {
    await expect(AddBlockPage({ searchParams: {} })).rejects.toThrow(
      "REDIRECT",
    );
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/timetable");
    expect(mockedGetUserID).not.toHaveBeenCalled();
  });

  it("redirects to timetable when setId is an empty string", async () => {
    await expect(AddBlockPage({ searchParams: { setId: "" } })).rejects.toThrow(
      "REDIRECT",
    );
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/timetable");
  });

  it("redirects to timetable when the user is not logged in", async () => {
    mockedGetUserID.mockResolvedValue(null);
    await expect(
      AddBlockPage({ searchParams: { setId: "set-1" } }),
    ).rejects.toThrow("REDIRECT");
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/timetable");
    expect(mockedCheckTimetableSetOwnership).not.toHaveBeenCalled();
  });

  it("redirects to timetable when the user does not own the set", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    mockedCheckTimetableSetOwnership.mockResolvedValue(false);
    await expect(
      AddBlockPage({ searchParams: { setId: "set-1" } }),
    ).rejects.toThrow("REDIRECT");
    expect(mockedCheckTimetableSetOwnership).toHaveBeenCalledWith(
      "set-1",
      "user-1",
    );
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/timetable");
    expect(mockedGetUserSettings).not.toHaveBeenCalled();
    expect(mockedGetUniqueSubjects).not.toHaveBeenCalled();
  });

  it("renders the add block form when the user owns the set", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    mockedCheckTimetableSetOwnership.mockResolvedValue(true);
    mockedGetUserSettings.mockResolvedValue({ theme: "dark" });
    const result = await AddBlockPage({ searchParams: { setId: "set-1" } });
    render(result);
    expect(screen.getByText("Add Block Form")).toBeInTheDocument();
  });

  it("passes the resolved settings to the form", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    mockedGetUserSettings.mockResolvedValue({ theme: "dark" });
    const result = await AddBlockPage({ searchParams: { setId: "set-1" } });
    render(result);
    expect(screen.getByTestId("add-block-form")).toHaveAttribute(
      "data-settings",
      JSON.stringify({ theme: "dark" }),
    );
  });

  it("passes null settings through to the form when getUserSettings resolves null", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    mockedGetUserSettings.mockResolvedValue(null);
    const result = await AddBlockPage({ searchParams: { setId: "set-1" } });
    render(result);
    expect(screen.getByTestId("add-block-form")).toHaveAttribute(
      "data-settings",
      "null",
    );
  });

  it("fetches settings using the resolved user id", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    const result = await AddBlockPage({ searchParams: { setId: "set-1" } });
    render(result);
    expect(mockedGetUserSettings).toHaveBeenCalledWith("user-1");
  });

  it("calls getUniqueSubjects with the setId from search params", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    const result = await AddBlockPage({ searchParams: { setId: "set-1" } });
    render(result);
    expect(mockedGetUniqueSubjects).toHaveBeenCalledWith("set-1");
  });

  it("passes the resolved subjectList to the form", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    mockedGetUniqueSubjects.mockResolvedValue(mockSubjectList);
    const result = await AddBlockPage({ searchParams: { setId: "set-1" } });
    render(result);
    expect(mockAddTimetableBlockComponent.mock.calls[0][0].subjectList).toEqual(
      mockSubjectList,
    );
  });

  it("binds addTimetableBlock with the setId from search params", async () => {
    mockedGetUserID.mockResolvedValue("user-1");
    const result = await AddBlockPage({ searchParams: { setId: "set-42" } });
    render(result);
    const boundAction = mockAddTimetableBlockComponent.mock.calls[0][0].action;
    const formData = new FormData();
    boundAction({ message: "", errors: {}, conflicts: [] }, formData);
    expect(mockedAddTimetableBlock).toHaveBeenCalledWith(
      "set-42",
      { message: "", errors: {}, conflicts: [] },
      formData,
    );
  });
});
