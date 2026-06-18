import EditTimetableBlockForm from "@/app/ui/timetable/edittimetableblock";
import { getBlockByID, getUserID, getUserSettings } from "@/lib/data";
import { redirect } from "next/navigation";
import { RetreivedTimetableBlocks } from "@/lib/definitions";

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

  return (
    <div>
      <EditTimetableBlockForm settings={settings} currentBlock={currentBlock} />
    </div>
  );
}
