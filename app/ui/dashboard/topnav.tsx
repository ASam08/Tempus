import { LucideGrid, LucideHome } from "lucide-react";
import Link from "next/link";
import TempusLogo from "@/components/branding/tempuslogo";
import TempusLogoBrand from "@/components/branding/tempuslogobrand";
import { AvatarDropdown } from "@/app/ui/avatarmenu";

export default function TopNav() {
  return (
    <div className="dark:shadow-accent flex max-w-screen flex-row gap-2 bg-stone-300 shadow-sm dark:bg-gray-900">
      <Link
        href="/dashboard"
        className="flex flex-row items-center self-center p-1"
      >
        <TempusLogoBrand
          width={200}
          height={70}
          showTagline={false}
          className="hidden md:inline"
        />
        <TempusLogo width={50} height={50} className="inline md:hidden" />
      </Link>
      <Link
        href="/dashboard"
        className="flex flex-row self-center p-2 font-semibold text-blue-600 xl:text-xl dark:text-blue-400"
      >
        <LucideHome />
        <span className="hidden md:flex md:pl-2">Home</span>
      </Link>
      <div className="hidden md:h-20"></div>
      <Link
        href="/dashboard/timetable"
        className="flex flex-row self-center p-2 font-semibold text-blue-600 xl:text-xl dark:text-blue-400"
      >
        <LucideGrid />
        <span className="hidden md:flex md:pl-2">Timetable</span>
      </Link>
      <div className="flex grow justify-end self-center p-2 md:pr-3">
        <AvatarDropdown />
      </div>
    </div>
  );
}
