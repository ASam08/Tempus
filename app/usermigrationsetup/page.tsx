import { Suspense } from "react";
import TempusLogoBrand from "@/components/branding/tempuslogobrand";
import { SetupForm } from "@/components/ui/usermigrationsetup/setup-form";

export default function SetupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <TempusLogoBrand width={340} height={105} />
        </div>
        <Suspense>
          <SetupForm />
        </Suspense>
      </div>
    </div>
  );
}
