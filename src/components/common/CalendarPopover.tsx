// src/components/common/CalendarPopover.tsx

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: Date;
  onPick: (d: Date) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

/**
 * 5-week grid (35 cells) instead of 6-week (42).
 * Starts at Sunday of the week that contains the 1st of the month.
 */
function getMonthGrid5(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const firstDayIdx = firstOfMonth.getDay(); // 0=Sun
  const gridStart = new Date(year, month, 1 - firstDayIdx);

  const cells: Date[] = [];
  for (let i = 0; i < 35; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return cells;
}

export function CalendarPopover({ value, onPick }: Props) {
  const [open, setOpen] = useState(false);

  // NOTE: selected = the date coming from DashboardLayout (baseDate)
  const selected = useMemo(() => startOfDay(value), [value]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  const [mode, setMode] = useState<"days" | "monthYear">("days");
  const [yearCursor, setYearCursor] = useState<number>(selected.getFullYear());

  useEffect(() => {
    const vm = new Date(selected.getFullYear(), selected.getMonth(), 1);
    setViewMonth(vm);
    setYearCursor(selected.getFullYear());
  }, [selected]);

  const cells = useMemo(() => getMonthGrid5(viewMonth), [viewMonth]);

  // Selected cell index within the 35-cell grid
  const selectedIndex = useMemo(() => {
    return cells.findIndex((d) => isSameDay(d, selected));
  }, [cells, selected]);

  // Which week-row (0..4) contains selected date
  const selectedRow = useMemo(() => {
    return selectedIndex >= 0 ? Math.floor(selectedIndex / 7) : -1;
  }, [selectedIndex]);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Click outside closes
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!open) return;
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
        setMode("days");
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        setMode("days");
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function openPopover() {
    setOpen((v) => !v);
    setMode("days");
  }

  return (
    // IMPORTANT: isolate creates a new stacking context so z-index behaves predictably
    <div ref={wrapRef} className="relative isolate">
      <button
        className="ml-2 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-sm"
        title="Pick a date"
        onClick={openPopover}
      >
        📅
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-[320px] rounded-2xl
            z-[9999]
            border border-white/15
            bg-[#0B1224]/90
            backdrop-blur-2xl
            shadow-2xl shadow-black/70
            overflow-hidden
          "
        >
          {/* solid dark base to stop bleed-through */}
          <div className="pointer-events-none absolute inset-0 bg-[#0B1224]/60" />

          {/* subtle glass sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-white/0 opacity-40" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-3 py-2 border-b border-white/10">
            <button
              className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
              onClick={() => {
                if (mode === "days") setViewMonth(addMonths(viewMonth, -1));
                else setYearCursor((y) => y - 1);
              }}
              aria-label={mode === "days" ? "Previous month" : "Previous year"}
            >
              ‹
            </button>

            {/* Clickable month/year title */}
            <button
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => {
                setMode((m) => (m === "days" ? "monthYear" : "days"));
                setYearCursor(viewMonth.getFullYear());
              }}
              title="Jump to month/year"
            >
              <div className="text-sm font-semibold text-slate-100">
                {mode === "days" ? monthLabel(viewMonth) : `${yearCursor}`}
              </div>
              <div className="text-[11px] text-slate-300/70 -mt-0.5 text-center">
                {mode === "days" ? "CLICK for MM/YY" : "SELECT MONTH"}
              </div>
            </button>

            <button
              className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
              onClick={() => {
                if (mode === "days") setViewMonth(addMonths(viewMonth, 1));
                else setYearCursor((y) => y + 1);
              }}
              aria-label={mode === "days" ? "Next month" : "Next year"}
            >
              ›
            </button>
          </div>

          {/* Body */}
          {mode === "days" ? (
            <>
              {/* Weekdays */}
              <div className="relative grid grid-cols-7 gap-1 px-3 pt-3">
                {WEEKDAYS.map((w, i) => {
                  const isWknd = i === 0 || i === 6;
                  return (
                    <div
                      key={w}
                      className={[
                        "text-[11px] text-center",
                        isWknd ? "text-slate-200/80" : "text-slate-300/70",
                      ].join(" ")}
                    >
                      {w}
                    </div>
                  );
                })}
              </div>

              {/* Days grid (Apple-style week band) */}
              <div className="relative px-3 py-3">
                <div className="grid gap-1">
                  {Array.from({ length: 5 }).map((_, row) => {
                    const rowCells = cells.slice(row * 7, row * 7 + 7);
                    const isBand = row === selectedRow;

                    return (
                      <div key={row} className="relative grid grid-cols-7 gap-1">
                        {/* Apple-style band behind the whole selected week */}
                        {isBand ? (
                          <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/[0.08] border border-white/10" />
                        ) : null}

                        {rowCells.map((d) => {
                          const inMonth = d.getMonth() === viewMonth.getMonth();
                          const isSel = isSameDay(d, selected);
                          const isTod = isSameDay(d, today);
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                          const base =
                            "relative h-10 rounded-lg border text-sm flex items-center justify-center transition-colors";

                          // Buttons: slightly more solid than before for clarity
                          const cls = isSel
                            ? "bg-slate-100 text-slate-900 border-slate-100"
                            : inMonth
                              ? [
                                  "bg-[#070B18]/70 border-white/10 text-slate-100",
                                  "hover:bg-[#0E1832]/70",
                                  isWeekend ? "text-slate-50" : "",
                                ].join(" ")
                              : [
                                  "bg-[#070B18]/50 border-white/10 text-slate-400",
                                  "hover:bg-[#0E1832]/60",
                                ].join(" ");

                          return (
                            <button
                              key={d.toISOString()}
                              className={[
                                base,
                                cls,
                                isTod && !isSel ? "ring-1 ring-white/25" : "",
                              ].join(" ")}
                              onClick={() => {
                                onPick(d);
                                setOpen(false);
                                setMode("days");
                              }}
                              title={d.toLocaleDateString("en-GB", {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            >
                              {d.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="relative px-3 py-3 border-t border-white/10 flex items-center justify-between">
                <button
                  className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                  onClick={() => {
                    onPick(new Date());
                    setOpen(false);
                    setMode("days");
                  }}
                >
                  Today
                </button>
                <div className="text-xs text-slate-300/70">Pick a date to jump to that week</div>
              </div>
            </>
          ) : (
            <>
              {/* Month/Year picker */}
              <div className="relative px-3 py-3">
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((m, idx) => {
                    const active = viewMonth.getFullYear() === yearCursor && viewMonth.getMonth() === idx;

                    return (
                      <button
                        key={m}
                        className={[
                          "h-10 rounded-lg border text-sm font-semibold transition-colors",
                          "border-white/10",
                          active
                            ? "bg-slate-100 text-slate-900"
                            : "bg-white/5 text-slate-100 hover:bg-white/10",
                        ].join(" ")}
                        onClick={() => {
                          const newView = new Date(yearCursor, idx, 1);
                          setViewMonth(newView);
                          setMode("days");
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative px-3 py-3 border-t border-white/10 flex items-center justify-between">
                <button
                  className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                  onClick={() => setMode("days")}
                >
                  Back
                </button>
                <div className="text-xs text-slate-300/70">Tip: Use ‹ › to change year</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
