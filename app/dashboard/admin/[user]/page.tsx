import { auth, User } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Session } from "better-auth";
import AdminActions from "@/components/ui/dashboard/admin/adminactions";
import EditUserForm from "@/components/ui/dashboard/admin/editUserForm";
import { Button } from "@/components/ui/button";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const chosenUser: User = await auth.api.getUser({
    query: {
      id: user,
    },
    headers: await headers(),
  });

  const chosenUserSessions: { sessions: Session[] } =
    await auth.api.listUserSessions({
      body: {
        userId: user,
      },
      headers: await headers(),
    });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        Admin Dashboard - {chosenUser.name}
      </h1>
      {chosenUser.banned && (
        <span className="ml-2 rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-800">
          Banned for: {chosenUser.banReason || "No reason provided"}
        </span>
      )}
      <div className="flex flex-row gap-4">
        <div className="w-full max-w-sm">
          <EditUserForm chosenUser={chosenUser} />
        </div>
        <div className="pt-7.5">
          <AdminActions
            {...chosenUser}
            currentUserId={session.user.id}
            trigger={
              <Button variant="secondary" type="button">
                More actions
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
