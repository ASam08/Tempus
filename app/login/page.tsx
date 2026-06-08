import { Suspense } from "react";
import { LoginForm } from "@/components/ui/login/login-form";
import TempusLogoBrand from "@/components/branding/tempuslogobrand";
import Link from "next/link";

export default function LoginPage() {
  let emailDisabled = false;
  if (
    process.env.EMAIL_DOMAIN === undefined ||
    process.env.RESEND_API_KEY === undefined
  ) {
    emailDisabled = true;
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
          <LoginForm emailDisabled={emailDisabled} />
        </Suspense>
      </div>
    </div>
  );
}
