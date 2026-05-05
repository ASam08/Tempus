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
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { User } from "@/lib/auth";

export default function AdminActions(user: User) {
  const router = useRouter();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontalIcon />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36" align="end">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Reset Password</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Access</DropdownMenuLabel>
          {user.banned ? (
            <DropdownMenuItem onClick={() => enableUser(user.id)}>
              Enable
            </DropdownMenuItem>
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Ban</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => banUser(user.id, "Account Not Yet Verified")}
                  >
                    Account Not Yet Verified
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => banUser(user.id, "Spamming")}
                  >
                    Spamming
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => banUser(user.id, "T&C Violation")}
                  >
                    T&C Violation
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => banUser(user.id, "Inappropriate Content")}
                  >
                    Inappropriate Content
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => banUser(user.id, "Fraudulent Activity")}
                  >
                    Fraudulent Activity
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
