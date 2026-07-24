import TopNav from "@/app/ui/dashboard/topnav";
import { AvatarDropdown } from "@/app/ui/avatarmenu";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col md:overflow-hidden">
      <div className="w-full flex-none">
        <TopNav />
      </div>

      <div className="grow p-1 md:overflow-y-auto md:p-6">{children}</div>
    </div>
  );
}
