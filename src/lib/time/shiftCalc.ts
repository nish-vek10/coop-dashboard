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

/** Total worked minutes for a shift (no break deduction). Crossing midnight is supported. */
export function shiftMinutes(shift?: Shift): number {
  if (!shift?.start || !shift?.end) return 0;
  const s = parseHHMM(shift.start);
  const e = parseHHMM(shift.end);
  if (s == null || e == null) return 0;

  let dur = e - s;
  if (dur < 0) dur += 24 * 60; // overnight shift

  return Math.max(0, dur);
}

/** Total worked hours for a shift, as a decimal (e.g. 6.5). */
export function shiftHours(shift?: Shift): number {
  return shiftMinutes(shift) / 60;
}

/** Amount earned for a single shift: hours worked x agreed hourly pay rate. */
export function shiftPay(shift: Shift | undefined, payRate: number): number {
  const rate = Number.isFinite(payRate) ? Math.max(0, payRate) : 0;
  return shiftHours(shift) * rate;
}
