import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  LucideLogOut,
  LucideUser2,
  LucideSettings,
  LucideUsers,
} from "lucide-react";
import Link from "next/link";

export async function AvatarDropdown() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return null;
  }

  let admin: boolean = false;

  if (session?.user.role === "admin") {
    admin = true;
  }

  const namesplit = session.user.name?.split(" ");
  const firstName = namesplit?.[0]?.toUpperCase() ?? "User";
  const lastName = namesplit?.[namesplit.length - 1]?.toUpperCase() ?? "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar size="lg">
            <AvatarFallback>
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {firstName} {lastName}
          </DropdownMenuLabel>
          <Link href="/dashboard/account">
            <DropdownMenuItem className="cursor-pointer">
              <LucideUser2 />
              Account
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/settings">
            <DropdownMenuItem className="cursor-pointer">
              <LucideSettings />
              Settings
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {admin && (
          <>
            <DropdownMenuGroup>
              <Link href="/dashboard/admin">
                <DropdownMenuItem className="cursor-pointer">
                  <LucideUsers />
                  Admin
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            variant="destructive"
            onClick={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/login");
            }}
          >
            <LucideLogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
