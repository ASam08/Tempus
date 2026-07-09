import AddTimetableBlock from "@/app/ui/timetable/addtimetableblock";
import {
  getUserID,
  getUserSettings,
  checkTimetableSetOwnership,
} from "@/lib/data";
import { redirect } from "next/navigation";
import { addTimetableBlock } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function addBlockPage({
  searchParams,
}: {
  searchParams: { setId?: string };
}) {
  const { setId } = await searchParams;
  if (!setId) {
    redirect("/dashboard/timetable");
  }
  const user_id = await getUserID();
  if (user_id === null) {
    redirect("/dashboard/timetable");
  }

  const ownsSet = await checkTimetableSetOwnership(setId, user_id);
  if (!ownsSet) {
    redirect("/dashboard/timetable");
  }

  const settings = await getUserSettings(user_id);

  const boundAction = addTimetableBlock.bind(null, setId);

  return (
    <div className="flex h-full max-w-2xl flex-col px-3 py-4 md:px-2">
      <AddTimetableBlock action={boundAction} settings={settings} />
    </div>
  );
}
