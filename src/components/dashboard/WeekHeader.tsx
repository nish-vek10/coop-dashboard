import { addDays } from "../../lib/date/week";

export function WeekHeader({
  baseDate,
  setBaseDate,
}: {
  baseDate: Date;
  setBaseDate: (d: Date) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B1224] p-4">
      <div className="flex items-center justify-end gap-3">
        <button
          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
          onClick={() => setBaseDate(addDays(baseDate, -7))}
        >
          Last Week
        </button>

        <button
          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
          onClick={() => setBaseDate(new Date())}
        >
          This Week
        </button>

        <button
          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
          onClick={() => setBaseDate(addDays(baseDate, 7))}
        >
          Next Week
        </button>

        <button
          className="ml-2 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-sm"
          title="Pick week"
          onClick={() => console.log("Pick week (calendar) clicked")}
        >
          📅
        </button>
      </div>
    </div>
  );
}
