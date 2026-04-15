"use client";

import { useEffect, useState } from "react";
import { fetchNextBreak } from "@/lib/actions";
import { RetreivedTimetableBlocks } from "@/lib/definitions";
import { LucidePause } from "lucide-react";
import { timeToMinutes } from "@/lib/utils";

export default function NextBreakCardClient() {
  const [block, setBlock] = useState<RetreivedTimetableBlocks | null>(null);
  const [loading, setLoading] = useState(true);
  const [minutesUntilNext, setMinutesUntilNext] = useState<number | null>(null);
  const [startMinutes, setStartMinutes] = useState<number | null>(null);
  const [foundUserId, setFoundUserId] = useState(true);

  const fetchNextBreakTask = async () => {
    const now = new Date();
    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const time = now.toTimeString().slice(0, 8);

    const next = await fetchNextBreak(dayOfWeek, time);
    if (next && "reason" in next) {
      setFoundUserId(false);
      setLoading(false);
      return;
    }

    // No next break today
    if (!next) {
      setBlock(null);
      setStartMinutes(null);
      setMinutesUntilNext(null);
      setLoading(false);
      return;
    }

    // At this point `next` is a valid block
    setBlock(next);

    setStartMinutes(timeToMinutes(next.end_time));

    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchNextBreakTask();
  }, []);

  useEffect(() => {
    if (startMinutes === null) return;

    const tick = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const diff = startMinutes - nowMinutes - 1;

      if (diff < 0) {
        // Block started → fetch next one
        fetchNextBreakTask();
        return;
      }

      setMinutesUntilNext(diff);
    };

    tick(); // run immediately
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startMinutes]);

  const hours =
    minutesUntilNext !== null && minutesUntilNext >= 60
      ? Math.floor(minutesUntilNext / 60)
      : null;

  const mins =
    hours !== null && minutesUntilNext !== null
      ? minutesUntilNext % 60
      : minutesUntilNext;

  if (!foundUserId) return null;

  if (loading) {
    return (
      <div className="w-full max-w-64 animate-pulse rounded-lg border-2 border-dashed p-4 md:w-1/3">
        <LucidePause className="float-right text-yellow-500" />
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="w-full max-w-64 rounded-lg border-2 border-dashed p-4 md:w-1/3">
        <LucidePause className="float-right text-yellow-500" />
        <p className="text-gray-400">Looks like you're already on break!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-64 rounded-lg border-2 p-4 md:w-1/3">
      <LucidePause className="float-right text-yellow-500" />
      <p className="font-bold">Next Break</p>
      <p className="text-sm">
        {minutesUntilNext === 0 && "Starting in less than 1 minute "}
        {minutesUntilNext === 1 && "Starting in 1 minute "}
        {hours === null &&
          minutesUntilNext! > 1 &&
          `Starting in ${minutesUntilNext} minutes `}
        {hours !== null &&
          `Starting in ${hours} hour${hours > 1 ? "s" : ""} and ${mins} minute${mins === 1 ? "" : "s"} `}
        at {block.end_time.slice(0, 5)}
      </p>
    </div>
  );
}
