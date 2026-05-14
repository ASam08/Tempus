"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { SortDirection } from "@/lib/definitions";

interface SortableHeaderProps {
  field: string;
  label: string;
  currentSortBy: string;
  currentSortDirection: SortDirection;
}

export default function SortableHeader({
  field,
  label,
  currentSortBy,
  currentSortDirection,
}: SortableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isActive = currentSortBy === field;
  const nextDirection =
    isActive && currentSortDirection === "asc" ? "desc" : "asc";

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortDirection", nextDirection);
    params.set("page", "1");
    router.push("?" + params.toString());
  };

  return (
    <button
      onClick={handleClick}
      className="hover:text-foreground flex items-center gap-1 font-medium"
    >
      {label}
      {isActive ? (
        currentSortDirection === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}
