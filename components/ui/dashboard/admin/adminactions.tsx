"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { User } from "@/lib/auth";
import { defaultBanReasons } from "@/lib/defaults";
import { UserRole } from "@/lib/definitions";
import { useState } from "react";
import { EditUserDialog } from "@/components/ui/dashboard/admin/edit-user-dialog";
import { toastNotifications } from "@/components/general/toast-notifications";

type AdminActionsProps = User & {
  currentUserId: string;
  trigger?: React.ReactElement;
};

export default function AdminActions({ trigger, ...user }: AdminActionsProps) {
  const router = useRouter();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);

  const isSelf = user.id === user.currentUserId;

  async function enableUser() {
    const ok = await toastNotifications(
      () => authClient.admin.unbanUser({ userId: user.id }),
      "User enabled",
      "Couldn't enable user",
    );
    if (ok) router.refresh();
  }

  async function banUser(banReason: string) {
    const ok = await toastNotifications(
      () => authClient.admin.banUser({ userId: user.id, banReason }),
      "User banned",
      "Couldn't ban user",
    );
    if (ok) router.refresh();
  }

  async function changeUserRole(newRole: UserRole) {
    setRoleDialogOpen(false);
    const ok = await toastNotifications(
      () => authClient.admin.setRole({ userId: user.id, role: newRole }),
      "Role updated",
      "Couldn't change role",
    );
    if (ok) router.refresh();
  }

  async function removeUser() {
    setRemoveUserDialogOpen(false);
    const ok = await toastNotifications(
      () => authClient.admin.removeUser({ userId: user.id }),
      "User removed",
      "Couldn't remove user",
    );
    if (ok) router.refresh();
  }

  return (
    <>
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are You Sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user&apos;s role to{" "}
              {user.role === "admin" ? "User" : "Admin"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                changeUserRole(user.role === "admin" ? "user" : "admin")
              }
            >
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeUserDialogOpen}
        onOpenChange={setRemoveUserDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are You Sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => removeUser()}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditUserDialog
        chosenUser={user}
        open={editUserDialogOpen}
        onOpenChange={setEditUserDialogOpen}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            trigger ?? (
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontalIcon />
                <span className="sr-only">Open menu</span>
              </Button>
            )
          }
        />
        <DropdownMenuContent className="w-36" align="end">
          <DropdownMenuItem onClick={() => setEditUserDialogOpen(true)}>
            Edit
          </DropdownMenuItem>
          {!isSelf && <DropdownMenuSeparator />}
          {!isSelf && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                {user.banned ? (
                  <DropdownMenuItem onClick={() => enableUser()}>
                    Enable
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Ban</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {defaultBanReasons.map((reason) => (
                        <DropdownMenuItem
                          key={reason}
                          onClick={() => banUser(reason)}
                        >
                          {reason}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-red-600">
                  Danger Zone
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
                  {user.role === "admin" ? "Set as User" : "Set as Admin"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setRemoveUserDialogOpen(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
