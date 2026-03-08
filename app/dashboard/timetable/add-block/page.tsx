import AddTimetableBlock from "@/app/ui/timetable/addtimetableblock";
import { getUserID, getTimetableSets } from "@/lib/data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function addBlockPage() {
  const user_id = await getUserID();
  if (user_id === null) {
    redirect("/dashboard/timetable");
  }
  const sets = await getTimetableSets(user_id);

  if (sets.length === 0) {
    redirect("/dashboard/timetable");
  }

  return (
    <div className="flex h-full max-w-2xl flex-col px-3 py-4 md:px-2">
      <AddTimetableBlock />
    </div>
  );
}
