import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { LucideInfo } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function PasswordRequirementsHover() {
  return (
    <div>
      <div className="hidden md:flex">
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
      </div>
      <div className="md:hidden">
        <Popover>
          <PopoverTrigger>
            <LucideInfo className="text-muted-foreground h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-lg">
            <p className="text-sm">Password must:</p>
            <ul className="list-disc pl-4 text-sm">
              <li>Be at least 8 characters long.</li>
              <li>Contain at least one letter.</li>
              <li>Contain at least one number.</li>
              <li>Contain at least one special character.</li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
