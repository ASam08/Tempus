"use client";

import { useEffect, useMemo, useState } from "react";
import { RetreivedTimetableBlocks } from "@/lib/definitions";
import { LucideEdit2, LucideX } from "lucide-react";
import { deleteBlock } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { defaultTimeSettings, defaultDaySettings } from "@/lib/defaults";
import { dowKeyValue, dowShortened } from "@/lib/constants";

const slotMinutes = 15;

const minSlotMinutes = 5; // Always use 5-minute resolution
const visibleSlotInterval = slotMinutes / minSlotMinutes;

function timeToRow(time: string, startHour: number) {
  const [h, m] = time.split(":").map(Number);
  return ((h - startHour) * 60 + m) / minSlotMinutes;
}

export function TimetableGrid({
  events = [],
  settings,
}: {
  events?: RetreivedTimetableBlocks[];
  settings: Record<string, string> | null;
}) {
  const [deleteMode, setDeleteMode] = useState(false);
  const [width, setWidth] = useState(1200);
  const router = useRouter();
  const startHour = Number(
    (settings?.["start_time"] ?? defaultTimeSettings.start_time).slice(0, 2),
  );
  const endHour = Number(
    (settings?.["end_time"] ?? defaultTimeSettings.end_time).slice(0, 2),
  );

  const dowArray = useMemo(
    () =>
      dowShortened.filter((day) => {
        const key = day.key;
        const raw = settings?.[key];
        if (raw === undefined) {
          return !!defaultDaySettings[key];
        }
        return raw === "true";
      }),
    [settings],
  );

  const dow = ["Time", ...dowArray.map((day) => day.label)];
  const middow = ["Time", ...dowArray.map((day) => day.mid)];
  const shortdow = ["Time", ...dowArray.map((day) => day.short)];

  const dayColumnMap = useMemo(
    () => Object.fromEntries(dowArray.map((day, i) => [day.dow, i + 2])),
    [dowArray],
  );

  const hoursCovered = endHour - startHour;
  const virtualRows = (hoursCovered * 60) / minSlotMinutes;
  const columns: number = dow.length - 1;
  console.log("Columns: ", columns);

  const handleDeleteBlock = async (id: string) => {
    if (!confirm("Delete this block?")) return;
    await deleteBlock(id);
    router.refresh();
  };

  const now = new Date();
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const labels = width > 900 ? dow : width > 600 ? middow : shortdow;

  return (
    <div className="max-h-full">
      <div className="mb-1 flex w-full grow">
        <div className="flex grow justify-end">
          <Button
            onClick={() => setDeleteMode((d) => !d)}
            className={`px-3 py-1 text-sm font-medium ${
              deleteMode ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            } `}
          >
            <LucideEdit2 />{" "}
            <span className="hidden sm:flex">
              {deleteMode ? "Stop Editing" : "Edit"}
            </span>
          </Button>
        </div>
      </div>

      <div className="max-h-100 overflow-auto border border-slate-400 xl:max-h-175 dark:border-slate-700">
        <div
          className="grid min-w-175"
          style={{
            gridTemplateColumns: `60px repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `40px repeat(${virtualRows}, 8px)`,
          }}
        >
          {/* ===== Header ===== */}
          {labels.map((label, i) => (
            <div
              key={`h-${i}`}
              className={`sticky top-0 z-12 flex items-center justify-center border border-slate-400 text-sm font-semibold text-black dark:border-slate-700 dark:text-white ${i == 0 ? "left-0 z-13 bg-slate-300 dark:bg-slate-800" : ""} ${i == dayOfWeek ? "bg-blue-800 text-white" : "bg-slate-300 dark:bg-slate-800"} `}
              style={{ gridColumn: i + 1, gridRow: 1 }}
            >
              {label}
            </div>
          ))}

          {/* ===== Time Column ===== */}
          {Array.from({ length: virtualRows }).map((_, i) => {
            const showLabel = i % visibleSlotInterval === 0;
            const totalMinutes = i * minSlotMinutes;
            const hour = startHour + Math.floor(totalMinutes / 60);
            const minute = totalMinutes % 60;
            const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            return (
              <div
                key={`t-${i}`}
                className={`sticky left-0 z-10 flex h-3 w-full items-center justify-end bg-slate-200 pr-1 text-right text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 ${showLabel ? "z-11 h-3 overflow-visible border-t border-slate-300 dark:border-slate-700" : ""} border-r border-l border-slate-300 dark:border-slate-700`}
                style={{ gridColumn: 1, gridRow: i + 2 }}
              >
                {showLabel ? (
                  minute === 0 ? (
                    <span className="font-bold">{label}</span>
                  ) : (
                    label
                  )
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            );
          })}

          {/* ===== Events ===== */}
          {(events ?? []).filter(Boolean).map((e) => {
            const start = Math.max(0, timeToRow(e.start_time, startHour));
            const end = Math.min(virtualRows, timeToRow(e.end_time, startHour));
            const duration = end - start;
            const dayIndex = dayColumnMap[e.day_of_week];
            if (end <= 0 || start >= virtualRows || !dayIndex) return null;
            return (
              <div
                key={e.id}
                className={`m-[1px] flex h-full flex-col overflow-hidden rounded-lg border border-blue-100 px-1 py-0.5 text-xs text-white dark:border-blue-900 ${e.day_of_week == dayOfWeek ? "bg-blue-600" : "bg-blue-800"} `}
                style={{
                  gridColumn: dayIndex,
                  gridRow: `${start + 2} / ${end + 2}`,
                }}
              >
                <div className="flex h-full flex-col">
                  <div className="flex flex-row">
                    {duration > 5 && (
                      <div className="flex grow justify-start p-0.5">
                        {e.start_time.slice(0, 5)}
                      </div>
                    )}
                    {deleteMode && (
                      <div className="flex grow justify-end p-0.5">
                        <LucideX
                          className="size-4 cursor-pointer text-gray-300 hover:text-white"
                          onClick={() => handleDeleteBlock(e.id)}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex grow items-center justify-center text-center ${
                      duration > 6
                        ? "p-0.5 font-bold"
                        : duration > 1
                          ? "p-0 text-xs leading-none"
                          : "p-0 text-[6px] leading-none"
                    } `}
                  >
                    {e.subject}
                  </div>
                  {duration > 6 && (
                    <div className="flex flex-row items-end">
                      <div className="flex grow justify-start p-0.5">
                        {e.end_time.slice(0, 5)}
                      </div>
                      <div className="flex grow justify-end p-0.5">
                        {e.location}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
