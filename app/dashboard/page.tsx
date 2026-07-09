import LocalDateDisplay from "@/components/ui/dashboard/localdate";
import LocalTimeDisplay from "@/components/ui/dashboard/localtime";
import CurrentCardClient from "@/app/ui/dashboard/currentcardclient";
import NextCardClient from "../ui/dashboard/nextcardclient";
import NextBreakCardClient from "../ui/dashboard/nextbreakcardclient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LucideUser } from "lucide-react";
import { getAllTimetableSets } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user_id = session?.user?.id;
  if (!user_id) {
    redirect("/login");
  }

  let admin: boolean = false;

  if (session?.user.role === "admin") {
    admin = true;
  }

  const timetableSets = await getAllTimetableSets(user_id);

  return (
    <div className="flex h-full max-w-screen flex-col px-3 py-4 md:px-2">
      <h1 className="flex flex-wrap text-2xl font-bold text-gray-800 md:mb-4 dark:text-gray-200">
        Dashboard
      </h1>
      <div className="flex flex-row">
        <div className="self-start-safe flex grow text-gray-600 dark:text-gray-400">
          {session?.user?.name ? `${session.user.name}, h` : "H"}ere's what's
          next on your schedule!
        </div>
        <div className="flex grow flex-col items-end-safe self-end-safe">
          <div className="flex grow text-right">
            <LocalDateDisplay />
          </div>
          <div className="flex grow text-right">
            <LocalTimeDisplay />
          </div>
        </div>
      </div>
      {timetableSets && timetableSets.length > 0 ? (
        timetableSets.map((set) => (
          <div key={set.id} className="mt-4 gap-2">
            {set.title}
            <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4">
              <CurrentCardClient setId={set.id} />
              <NextBreakCardClient setId={set.id} />
              <NextCardClient setId={set.id} />
            </div>
          </div>
        ))
      ) : (
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4">
          <div className="w-full max-w-64 rounded-lg border-2 border-dashed p-4 md:w-1/3">
            <p className="text-gray-400">
              Nothing to see here, add a timetable to get started!
            </p>
          </div>
        </div>
      )}
      {admin && (
        <div className="my-4 flex">
          <Button className="flex">
            <Link className="flex" href="/dashboard/admin">
              <LucideUser className="mr-2" /> Admin
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
