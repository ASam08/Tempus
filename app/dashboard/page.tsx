import LocalDateDisplay from "@/components/ui/dashboard/localdate";
import LocalTimeDisplay from "@/components/ui/dashboard/localtime";
import CurrentCardClient from "@/app/ui/dashboard/currentcardclient";
import NextCardClient from "../ui/dashboard/nextcardclient";
import NextBreakCardClient from "../ui/dashboard/nextbreakcardclient";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  // console.log("SESSION:", session);

  return (
    <div className="flex h-full max-w-screen flex-col px-3 py-4 md:px-2">
      <h1 className="flex flex-wrap text-2xl font-bold text-gray-800 md:mb-4 dark:text-gray-200">
        Dashboard
      </h1>
      <div className="flex flex-row">
        <div className="self-start-safe flex grow text-gray-600 dark:text-gray-400">
          {" "}
          {session?.user.name ? `${session.user.name}, h` : "H"}ere's what's
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
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4">
        <CurrentCardClient />
        <NextBreakCardClient />
        <NextCardClient />
      </div>
    </div>
  );
}
