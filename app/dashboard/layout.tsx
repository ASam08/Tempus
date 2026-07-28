import TopNav from "@/app/ui/dashboard/topnav";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col md:overflow-hidden">
      <div className="w-full flex-none">
        <TopNav />
      </div>

      <div className="grow py-2 md:overflow-y-auto md:px-4">{children}</div>
    </div>
  );
}
