// src/app/layout/DashboardLayout.tsx

import { useMemo, useState } from "react";
import { RotaGrid } from "../../components/dashboard/RotaGrid";
import { CalendarPopover } from "../../components/common/CalendarPopover";
import { getWeekDays, getSunday } from "../../lib/date/week";

function formatWeekStartingSunday(sunday: Date): string {
  // "Sunday 08th February 2026"
  const day = sunday.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  const dayStr = String(day).padStart(2, "0") + suffix;
  const monthYear = sunday.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const weekday = sunday.toLocaleDateString("en-GB", { weekday: "long" });
  return `${weekday} ${dayStr} ${monthYear}`;
}

export function DashboardLayout() {
  const [baseDate, setBaseDate] = useState<Date>(new Date());

  const weekStartSunday = useMemo(() => getSunday(baseDate), [baseDate]);
  const days = useMemo(() => getWeekDays(baseDate), [baseDate]);

  function goPrevWeek() {
    setBaseDate(new Date(weekStartSunday.getTime() - 7 * 24 * 60 * 60 * 1000));
  }
  function goNextWeek() {
    setBaseDate(new Date(weekStartSunday.getTime() + 7 * 24 * 60 * 60 * 1000));
  }
  function goThisWeek() {
    setBaseDate(new Date());
  }

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-br from-[#0B1430] via-[#070B18] to-[#1A0B2E] relative overflow-hidden">
      {/* Background glow layers */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-48 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      {/* Subtle texture overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:18px_18px]" />

      {/* Top Header */}
      <header className="relative z-50 h-16 px-6 flex items-center border-b border-white/10 bg-white/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/5">
        {/* Left: Title */}
        <div className="min-w-[220px]">
          <h1 className="text-lg font-semibold tracking-wide">CO-OP WEEKLY ROTA</h1>
        </div>

        {/* Center: Week Starting */}
        <div className="flex-1 flex justify-center">
          <div className="text-sm font-semibold text-slate-300">
            WEEK STARTING ➢ {formatWeekStartingSunday(weekStartSunday)}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="min-w-[380px] hidden md:flex justify-end items-center gap-3">
          <button
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={goPrevWeek}
          >
            ◀ {/* Last Week */}
          </button>

          <button
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={goThisWeek}
          >
            This Week
          </button>

          <button
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={goNextWeek}
          >
            ▶ {/* Next Week */}
          </button>

          {/* Premium calendar popover */}
          <CalendarPopover value={baseDate} onPick={(d) => setBaseDate(d)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 px-6 py-6">
        <RotaGrid days={days} />
      </main>
    </div>
  );
}
