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
import { LucideLogOut, LucideUser2, LucideSettings } from "lucide-react";
import Link from "next/link";

export async function AvatarDropdown() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return null;
  }

  const firstName = session.user.name?.split(" ")[0] ?? "User";
  const lastName = session.user.name?.split(" ")[1] ?? "";
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
          <DropdownMenuItem className="cursor-pointer">
            <LucideUser2 />
            Account
          </DropdownMenuItem>
          <Link href="/dashboard/settings">
            <DropdownMenuItem className="cursor-pointer">
              <LucideSettings />
              Settings
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
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
