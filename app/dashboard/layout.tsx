import SideNav from "@/app/ui/dashboard/sidenav";
import { AvatarDropdown } from "@/app/ui/avatarmenu";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-48">
        <SideNav />
      </div>
      <div className="fixed right-2 top-2 justify-end md:right-4 md:top-4">
<AvatarDropdown />
        </div>
      <div className="grow p-1 md:overflow-y-auto md:p-6">{children}</div>
    </div>
  );
}
