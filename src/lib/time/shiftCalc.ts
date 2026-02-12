// src/lib/time/shiftCalc.ts

import type { Shift } from "../../types/rota";

export function parseHHMM(v: string): number | null {
  // returns minutes since midnight
  const m = /^(\d{2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function clampToStep(mins: number, step: number): number {
  return Math.round(mins / step) * step;
}

export function shiftPaidMinutes(shift?: Shift): number {
  if (!shift?.start || !shift?.end) return 0;
  const s = parseHHMM(shift.start);
  const e = parseHHMM(shift.end);
  if (s == null || e == null) return 0;

  // If end is earlier than start, treat as crossing midnight
  let dur = e - s;
  if (dur < 0) dur += 24 * 60;

  const br = Math.max(0, Number(shift.breakMins ?? 0));
  const paid = Math.max(0, dur - br);
  return paid;
}
