import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { LucideInfo } from "lucide-react";

export function PasswordRequirementsHover() {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <LucideInfo className="text-muted-foreground h-4 w-4" />
      </HoverCardTrigger>
      <HoverCardContent className="w-full max-w-lg">
        <p className="text-sm">Password must:</p>
        <ul className="list-disc pl-4 text-sm">
          <li>Be at least 8 characters long.</li>
          <li>Contain at least one letter.</li>
          <li>Contain at least one number.</li>
          <li>Contain at least one special character.</li>
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}
