import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LucideGrid2X2Plus, PlusCircle } from "lucide-react";
import { TimetableGrid } from "@/app/ui/timetable/newtimetable";
import {
  getAllTimetableSets,
  checkTimetableSetOwnership,
  getTimetableBlocks,
  getUserSettings,
} from "@/lib/data";
import { RetreivedTimetableBlocks } from "@/lib/definitions";
import TimetableSetSelect from "@/app/ui/timetable/timetablesetselect";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function timetablePage({
  searchParams,
}: {
  searchParams: { set?: string };
}) {
  const { set } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user_id = session?.user?.id;
  if (!user_id) {
    redirect("/login");
  }

  const timetable_sets: { id: string; title: string }[] | null = user_id
    ? await getAllTimetableSets(user_id)
    : null;

  const settings = (await getUserSettings(user_id)) ?? null;

  const selectedSetId =
    set ??
    settings?.last_timetable_set_id ??
    timetable_sets?.[0]?.id ??
    undefined;
  let events: RetreivedTimetableBlocks[] = [];
  if (selectedSetId) {
    const isSetOwner = await checkTimetableSetOwnership(selectedSetId, user_id);
    if (isSetOwner === true) {
      events = await getTimetableBlocks(selectedSetId);
    } else {
      console.warn(
        `WARN: User ${user_id} tried to show timetable set ${selectedSetId} but does not own it.`,
      );
    }
  }

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <div className="mb-4 flex flex-col items-center justify-start gap-4 sm:flex-row">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Timetable
        </h1>
        {timetable_sets && timetable_sets.length > 1 && (
          <TimetableSetSelect
            timetableSets={timetable_sets}
            selectedSetId={selectedSetId}
          />
        )}
      </div>

      {timetable_sets && timetable_sets.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex-rows flex">
            <div className="flex grow">
              <Link href="./timetable/new-timetable">
                <Button className="hidden bg-blue-600 text-white sm:flex">
                  <LucideGrid2X2Plus />
                  Create New Timetable
                </Button>
                <Button className="flex bg-blue-600 text-white sm:hidden">
                  <LucideGrid2X2Plus />
                </Button>
              </Link>
            </div>

            <div className="flex grow justify-end">
              <Link
                href={`/dashboard/timetable/add-block?setId=${selectedSetId}`}
              >
                <Button className="hidden bg-blue-600 text-white sm:flex">
                  <PlusCircle /> Add Timetable Block
                </Button>
                <Button className="flex bg-blue-600 text-white sm:hidden">
                  <PlusCircle />
                </Button>
              </Link>
            </div>
          </div>
          <TimetableGrid events={events ?? []} settings={settings} />
        </div>
      ) : (
        <div className="items-justify-center flex flex-col items-center gap-4">
          You haven't created a timetable yet
          <div className="flex grow">
            <Link href="./timetable/new-timetable">
              <Button className="hidden bg-blue-600 text-white sm:flex">
                <LucideGrid2X2Plus />
                Create New Timetable
              </Button>
              <Button className="flex bg-blue-600 text-white sm:hidden">
                <LucideGrid2X2Plus />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
