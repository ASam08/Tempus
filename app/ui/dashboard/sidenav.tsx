import {
  LucideGrid,
  LucideHome,
  LucideLogOut,
  LucideSettings,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/auth";
import TempusLogo from "@/components/branding/tempuslogo";
import TempusLogoBrand from "@/components/branding/tempuslogobrand";

export default function SideNav() {
  const authOn = process.env.AUTH_ON?.toLowerCase() === "true";
  return (
    <div className="flex max-w-screen flex-row gap-2 bg-stone-300 px-2 py-2 md:h-full md:flex-col md:py-4 dark:bg-gray-900">
      <Link href="/dashboard">
        <TempusLogoBrand
          width={200}
          height={70}
          showTagline={false}
          className="hidden md:inline"
        />
        <TempusLogo
          width={50}
          height={50}
          className="inline align-middle md:hidden"
        />{" "}
      </Link>
      <Link
        href="/dashboard"
        className="mb-4 flex flex-row rounded-xl border-2 border-stone-500 bg-stone-400 p-2 font-semibold text-blue-600 xl:text-xl dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400"
      >
        <LucideHome />
        <span className="hidden md:flex md:pl-2">Home</span>
      </Link>
      <div className="hidden md:h-20"></div>
      <Link
        href="/dashboard/timetable"
        className="mb-4 flex flex-row rounded-xl border-2 border-stone-500 bg-stone-400 p-2 font-semibold text-blue-600 xl:text-xl dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400"
      >
        <LucideGrid />
        <span className="hidden md:flex md:pl-2">Timetable</span>
      </Link>
      <Link
        href="/dashboard/settings"
        className="mb-4 flex flex-row rounded-xl border-2 border-stone-500 bg-stone-400 p-2 font-semibold text-blue-600 xl:text-xl dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400"
      >
        <LucideSettings />
        <span className="hidden md:flex md:pl-2">Settings</span>
      </Link>
      {authOn && (
        <form
          className="flex flex-col"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="mb-4 flex flex-row rounded-xl border-2 border-stone-500 bg-stone-400 p-2 font-semibold text-blue-600 xl:text-xl dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400">
            <LucideLogOut />
            <span className="hidden md:flex md:pl-2">Sign Out</span>
          </button>
        </form>
      )}
    </div>
  );
}
