import EditTimetableBlockForm from "@/app/ui/timetable/edittimetableblock";
import { getBlockByID, getUserID, getUserSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import { RetreivedTimetableBlocks } from "@/lib/definitions";
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
  const currentBlock: RetreivedTimetableBlocks | null = await getBlockByID(
    blockID,
    user_id,
  );
  if (!currentBlock) {
    redirect("/dashboard/timetable");
  }

  const boundAction = updateTimetableBlock.bind(null, blockID);

  return (
    <div className="flex h-full max-w-2xl flex-col px-3 py-4 md:px-2">
      <EditTimetableBlockForm
        action={boundAction}
        settings={settings}
        currentBlock={currentBlock}
      />
    </div>
  );
}
