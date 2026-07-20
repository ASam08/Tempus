import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AccountForm from "@/app/ui/account/accountform";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user_id = session?.user?.id;
  if (!user_id) {
    redirect("/login");
  }

  return (
    <div className="flex h-full max-w-screen flex-col px-3 py-4 md:px-2">
      <h1 className="flex flex-wrap text-2xl font-bold text-gray-800 md:mb-4 dark:text-gray-200">
        Account
      </h1>
      <AccountForm user={session.user} />
    </div>
  );
}
