"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
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

type AdminActionsProps = User & {
  currentUserId: string;
  trigger?: React.ReactNode;
};

export default function AdminActions({ trigger, ...user }: AdminActionsProps) {
  const router = useRouter();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);

  const isSelf = user.id === user.currentUserId;

  async function enableUser(userId: string) {
    await authClient.admin.unbanUser({
      userId: userId,
    });
    router.refresh();
  }

  async function banUser(userId: string, banReason: string) {
    await authClient.admin.banUser({
      userId: userId,
      banReason: banReason,
    });
    router.refresh();
  }

  async function changeUserRole(userId: string, newRole: UserRole) {
    await authClient.admin.setRole({
      userId: userId,
      role: newRole,
    });
    router.refresh();
  }

  async function removeUser(userId: string) {
    await authClient.admin.removeUser({
      userId: userId,
    });
    router.refresh();
  }

  async function editUser(userId: string) {
    router.push(`/dashboard/admin/${userId}`);
  }

  return (
    <>
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are You Sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's role to{" "}
              {user.role === "admin" ? "User" : "Admin"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                changeUserRole(
                  user.id,
                  user.role === "admin" ? "user" : "admin",
                )
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
              onClick={() => removeUser(user.id)}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-36" align="end">
          <DropdownMenuItem onClick={() => editUser(user.id)}>
            Edit
          </DropdownMenuItem>
          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Account Status</DropdownMenuLabel>
                {user.banned ? (
                  <DropdownMenuItem onClick={() => enableUser(user.id)}>
                    Enable
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Ban</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {defaultBanReasons.map((reason) => (
                          <DropdownMenuItem
                            key={reason}
                            onClick={() => banUser(user.id, reason)}
                          >
                            {reason}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-red-600">
                  Danger Zone
                </DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setRoleDialogOpen(true)}>
                  {user.role === "admin" ? "Set as User" : "Set as Admin"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRemoveUserDialogOpen(true)}
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
