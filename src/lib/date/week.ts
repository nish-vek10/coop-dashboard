// src/lib/date/week.ts

export function getSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDays(baseDate: Date): Date[] {
  const sunday = getSunday(baseDate);
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
