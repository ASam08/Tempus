"use client";

import { useEffect, useState } from "react";
import { fetchNextBlock } from "@/lib/actions";
import { RetreivedTimetableBlocks } from "@/lib/definitions";
import { LucideSkipForward } from "lucide-react";
import { timeToMinutes } from "@/lib/utils";

export default function NextCardClient() {
  const [block, setBlock] = useState<RetreivedTimetableBlocks | null>(null);
  const [loading, setLoading] = useState(true);
  const [minutesUntilNext, setMinutesUntilNext] = useState<number | null>(null);
  const [startMinutes, setStartMinutes] = useState<number | null>(null);
  const [foundUserId, setFoundUserId] = useState(true);

  const fetchNext = async () => {
    const now = new Date();
    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const time = now.toTimeString().slice(0, 8);

    const next = await fetchNextBlock(dayOfWeek, time);
    // Distinguish the "no user" sentinel from a valid response of "no next block"
    if (
      next &&
      ((next as any).reason === "no-user" || (next as any).reason === "no-set")
    ) {
      setFoundUserId(false);
      setLoading(false);
      return;
    }

    // No next block today
    if (!next) {
      setBlock(null);
      setStartMinutes(null);
      setMinutesUntilNext(null);
      setLoading(false);
      return;
    }

    setBlock(next as RetreivedTimetableBlocks);

    if ((next as RetreivedTimetableBlocks).start_time) {
      setStartMinutes(
        timeToMinutes((next as RetreivedTimetableBlocks).start_time),
      );
    } else {
      setStartMinutes(null);
      setMinutesUntilNext(null);
    }

    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchNext();
  }, []);

  useEffect(() => {
    if (startMinutes === null) return;

    const tick = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const diff = startMinutes - nowMinutes - 1;

      if (diff < 0) {
        // Block started → fetch next one
        fetchNext();
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
        <LucideSkipForward className="float-right text-blue-600" />
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="w-full max-w-64 rounded-lg border-2 border-dashed p-4 md:w-1/3">
        <LucideSkipForward className="float-right text-blue-600" />
        <p className="text-gray-400">
          Looks like you're free for the rest of the day!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-64 rounded-lg border-2 p-4 md:w-1/3">
      <LucideSkipForward className="float-right text-blue-600" />
      <p className="text-sm text-gray-400">
        {minutesUntilNext === -1 && "Starting now"}
        {minutesUntilNext === 0 && "Starting in less than 1 minute"}
        {minutesUntilNext === 1 && "Starting in 1 minute"}
        {hours === null &&
          minutesUntilNext! > 1 &&
          `Starting in ${minutesUntilNext} minutes`}
        {hours !== null &&
          `Starting in ${hours} hour${hours > 1 ? "s" : ""} and ${mins} minute${mins === 1 ? "" : "s"}`}
      </p>

      <p className="font-bold">{block.subject}</p>
      <p className="text-sm">{block.location}</p>
      <p className="text-sm">Finishes at {block.end_time.slice(0, 5)}</p>
    </div>
  );
}
