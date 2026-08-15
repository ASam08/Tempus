import EditTimetableBlockForm from "@/app/ui/timetable/edittimetableblock";
import {
  getBlockByID,
  getUniqueSubjects,
  getUserID,
  getUserSettings,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { RetreivedTimetableBlocksWithSetId } from "@/lib/definitions";
import { updateTimetableBlock } from "@/lib/actions";

export default async function EditBlockPage({
  params,
}: {
  params: Promise<{ blockID: string }>;
}) {
  const user_id = await getUserID();
  if (user_id === null) {
    redirect("/dashboard/timetable");
  }
  const settings = await getUserSettings(user_id);

  const { blockID } = await params;
  const currentBlock: RetreivedTimetableBlocksWithSetId | null =
    await getBlockByID(blockID, user_id);
  if (!currentBlock) {
    redirect("/dashboard/timetable");
  }

  const subjectList = await getUniqueSubjects(currentBlock.set_id);

  const boundAction = updateTimetableBlock.bind(null, blockID);

  return (
    <div className="flex h-full max-w-2xl flex-col px-3 md:px-2">
      <EditTimetableBlockForm
        action={boundAction}
        settings={settings}
        currentBlock={currentBlock}
        subjectList={subjectList}
      />
    </div>
  );
}
