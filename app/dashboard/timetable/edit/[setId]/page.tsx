import EditTimetable from "@/app/ui/timetable/edittimetableform";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkTimetableSetOwnership, getTimetableSetByID } from "@/lib/data";
import { redirect } from "next/navigation";
import { updateTimetableSet } from "@/lib/actions";

export default async function EditTimetablePage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user_id = session?.user?.id;
  if (!user_id) {
    redirect("/login");
  }
  const ownsTimetable = await checkTimetableSetOwnership(setId, user_id);
  if (!ownsTimetable) {
    redirect("/dashboard/timetable");
  }
  const currentTimetable = await getTimetableSetByID(setId, user_id);
  if (!currentTimetable) {
    redirect("/dashboard/timetable");
  }

  const boundAction = updateTimetableSet.bind(null, setId);

  return (
    <div className="flex h-full max-w-2xl flex-col px-3 py-4 md:px-2">
      <EditTimetable action={boundAction} currentTimetable={currentTimetable} />
    </div>
  );
}
