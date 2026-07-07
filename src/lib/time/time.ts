// src/lib/time/time.ts

export function minutesToHHMM(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** e.g. 390 -> "6.5h" (trailing .0 trimmed) */
export function minutesToHoursLabel(totalMins: number): string {
  const hours = totalMins / 60;
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2)}h`;
}

/** e.g. 30 -> "£30.00" */
export function formatGBP(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}
