import { Suspense } from "react";
import { SignupForm } from "@/components/ui/signup/signup-form";
import { redirect } from "next/navigation";
import Link from "next/link";
import TempusLogoBrand from "@/components/branding/tempuslogobrand";

export default function SignUpPage() {
  const authOn = process.env.AUTH_ON?.toLowerCase() === "true";
  if (!authOn) {
    redirect("/dashboard");
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="#"
          className="flex items-center gap-2 self-center font-medium"
        >
          <TempusLogoBrand width={340} height={105} />
        </Link>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
