"use client";

import { LucideGrid, LucideHome, LucideSettings } from "lucide-react";
import Link from "next/link";
import TempusLogo from "@/components/branding/tempuslogo";
import TempusLogoBrand from "@/components/branding/tempuslogobrand";
import { AvatarDropdown } from "@/app/ui/avatarmenu";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Home", icon: LucideHome },
  { href: "/dashboard/timetable", label: "Timetable", icon: LucideGrid },
  { href: "/dashboard/settings", label: "Settings", icon: LucideSettings },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <div className="flex max-w-screen flex-row gap-2 bg-stone-300 dark:bg-gray-900">
      <Link
        href="/dashboard"
        className="flex flex-row items-center self-center p-1"
      >
        <TempusLogoBrand
          width={100}
          height={40}
          showTagline={false}
          className="hidden md:inline"
        />
        <TempusLogo width={40} height={40} className="inline md:hidden" />
      </Link>
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-row self-center p-2 ${
              isActive
                ? "text-blue-600 underline decoration-2 underline-offset-4"
                : "text-primary"
            }`}
          >
            <Icon height={27} width={27} />
            <span className="hidden self-center md:flex md:pl-2">{label}</span>
          </Link>
        );
      })}
      <div className="flex grow justify-end self-center md:pr-3">
        <AvatarDropdown />
      </div>
    </div>
  );
}
