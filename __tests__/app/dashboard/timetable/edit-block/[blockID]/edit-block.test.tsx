import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import {
  getUserID,
  getUserSettings,
  getBlockByID,
  getUniqueSubjects,
} from "@/lib/data";
import { updateTimetableBlock } from "@/lib/actions";
import { RetreivedTimetableBlocksWithSetId } from "@/lib/definitions";
import EditTimetableBlockForm from "@/app/ui/timetable/edittimetableblock";
import EditBlockPage from "@/app/dashboard/timetable/edit-block/[blockID]/page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("redirect");
  }),
}));

jest.mock("@/lib/data", () => ({
  getUserID: jest.fn(),
  getUserSettings: jest.fn(),
  getBlockByID: jest.fn(),
  getUniqueSubjects: jest.fn(),
}));

jest.mock("@/lib/actions", () => ({
  updateTimetableBlock: jest.fn(),
}));

jest.mock("@/app/ui/timetable/edittimetableblock", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="edit-form" />),
}));

const mockSettings = { hide_dow: [] };
const mockBlock: RetreivedTimetableBlocksWithSetId = {
  id: "block-1",
  subject: "Test Block",
  location: "Test Location",
  day_of_week: 1,
  start_time: "09:00",
  end_time: "10:00",
  colour: "blue",
  set_id: "set-1",
};
const mockSubjectList = ["Maths", "English", "Science"];
const mockParams = Promise.resolve({ blockID: "block-1" });

describe("EditBlockPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (redirect as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("redirect");
    });
    (getUserID as unknown as jest.Mock).mockResolvedValue("user-1");
    (getUserSettings as unknown as jest.Mock).mockResolvedValue(mockSettings);
    (getBlockByID as unknown as jest.Mock).mockResolvedValue(mockBlock);
    (getUniqueSubjects as unknown as jest.Mock).mockResolvedValue(
      mockSubjectList,
    );
    (updateTimetableBlock as unknown as jest.Mock).mockResolvedValue(undefined);
  });

  it("redirects to timetable when user_id is null", async () => {
    (getUserID as unknown as jest.Mock).mockResolvedValue(null);
    await expect(EditBlockPage({ params: mockParams })).rejects.toThrow(
      "redirect",
    );
    expect(redirect).toHaveBeenCalledWith("/dashboard/timetable");
  });

  it("redirects to timetable when block is not found", async () => {
    (getBlockByID as unknown as jest.Mock).mockResolvedValue(null);
    await expect(EditBlockPage({ params: mockParams })).rejects.toThrow(
      "redirect",
    );
    expect(redirect).toHaveBeenCalledWith("/dashboard/timetable");
  });

  it("does not call getUniqueSubjects when block is not found", async () => {
    (getBlockByID as unknown as jest.Mock).mockResolvedValue(null);
    await expect(EditBlockPage({ params: mockParams })).rejects.toThrow(
      "redirect",
    );
    expect(getUniqueSubjects).not.toHaveBeenCalled();
  });

  it("calls getBlockByID with the resolved blockID and user_id", async () => {
    const jsx = await EditBlockPage({ params: mockParams });
    render(jsx);
    expect(getBlockByID).toHaveBeenCalledWith("block-1", "user-1");
  });

  it("calls getUserSettings with the resolved user_id", async () => {
    const jsx = await EditBlockPage({ params: mockParams });
    render(jsx);
    expect(getUserSettings).toHaveBeenCalledWith("user-1");
  });

  it("calls getUniqueSubjects with the current block's set_id", async () => {
    const jsx = await EditBlockPage({ params: mockParams });
    render(jsx);
    expect(getUniqueSubjects).toHaveBeenCalledWith("set-1");
  });

  it("renders the EditTimetableBlockForm", async () => {
    const jsx = await EditBlockPage({ params: mockParams });
    render(jsx);
    expect(screen.getByTestId("edit-form")).toBeInTheDocument();
  });

  it("passes settings, currentBlock and subjectList to EditTimetableBlockForm", async () => {
    const jsx = await EditBlockPage({ params: mockParams });
    render(jsx);
    expect(EditTimetableBlockForm).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: mockSettings,
        currentBlock: mockBlock,
        subjectList: mockSubjectList,
      }),
      undefined,
    );
  });

  it("passes a bound updateTimetableBlock action to EditTimetableBlockForm", async () => {
    const jsx = await EditBlockPage({ params: mockParams });
    render(jsx);
    const { action } = (EditTimetableBlockForm as unknown as jest.Mock).mock
      .calls[0][0];
    expect(typeof action).toBe("function");
  });

  it("renders the wrapper div with expected classes", async () => {
    const jsx = await EditBlockPage({ params: mockParams });
    const { container } = render(jsx);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("h-full");
    expect(wrapper.className).toContain("max-w-2xl");
  });
});
