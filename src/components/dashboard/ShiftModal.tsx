// src/components/dashboard/ShiftModal.tsx

import { useEffect, useMemo, useState } from "react";
import type { Shift } from "../../types/rota";
import { clampToStep, parseHHMM, shiftHours, shiftPay } from "../../lib/time/shiftCalc";
import { formatGBP } from "../../lib/time/time";

type Props = {
  open: boolean;
  title: string;
  initial?: Shift;
  payRate: number;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onClear?: () => void;
};

const STEP = 15;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += STEP) out.push(`${pad2(h)}:${pad2(m)}`);
  }
  return out;
}
const TIME_OPTIONS = buildTimeOptions();

function normaliseTimeInput(raw: string): string {
  const s = raw.trim();

  // already HH:MM -> snap to 15 mins if needed
  const parsed = parseHHMM(s);
  if (parsed != null) {
    const snapped = clampToStep(parsed, STEP);
    const hh = Math.floor(snapped / 60);
    const mm = snapped % 60;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  // digits only: "900" "915" "1330" "0900"
  if (/^\d{3,4}$/.test(s)) {
    const digits = s.padStart(4, "0"); // 900 -> 0900
    const hh = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2, 4));
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      const snapped = clampToStep(hh * 60 + mm, STEP);
      const H = Math.floor(snapped / 60);
      const M = snapped % 60;
      return `${pad2(H)}:${pad2(M)}`;
    }
  }

  // if not recognised, keep original (validation will show error)
  return s;
}

export function ShiftModal({ open, title, initial, payRate, onClose, onSave, onClear }: Props) {
  const [start, setStart] = useState<string>(initial?.start ?? "");
  const [end, setEnd] = useState<string>(initial?.end ?? "");

  useEffect(() => {
    if (!open) return;
    setStart(initial?.start ?? "");
    setEnd(initial?.end ?? "");
  }, [open, initial?.start, initial?.end]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const error = useMemo(() => {
    if (!start && !end) return "";
    if (!start || !end) return "Please enter both Start and End.";

    const s = parseHHMM(start);
    const e = parseHHMM(end);
    if (s == null || e == null) return "Start/End must be a valid time.";

    return "";
  }, [start, end]);

  const preview = useMemo(() => {
    if (error || !start || !end) return null;
    const shift: Shift = { start, end };
    const hours = shiftHours(shift);
    const pay = shiftPay(shift, payRate);
    return { hours, pay };
  }, [start, end, payRate, error]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B1224] shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="text-base font-semibold">{title}</div>
          <div className="text-xs text-slate-400 mt-0.5">Insert Shift times.</div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start (HH:MM)</label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-[#070B18] px-3 py-2 text-sm outline-none focus:border-slate-600"
                placeholder="e.g. 09:00"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                onBlur={() => setStart((v) => normaliseTimeInput(v))}
                list="rota-times"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">End (HH:MM)</label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-[#070B18] px-3 py-2 text-sm outline-none focus:border-slate-600"
                placeholder="e.g. 17:00"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                onBlur={() => setEnd((v) => normaliseTimeInput(v))}
                list="rota-times"
                inputMode="numeric"
              />
            </div>
          </div>

          <datalist id="rota-times">
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="text-xs text-slate-400">Earnings for this shift</div>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-sm text-slate-300">
                {preview ? `${preview.hours.toFixed(2)} hrs` : "—"} @ £{payRate.toFixed(2)}/hr
              </span>
              <span className="text-base font-bold text-emerald-300">
                {preview ? formatGBP(preview.pay) : "£0.00"}
              </span>
            </div>
          </div>

          {error ? (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>

        <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            className="text-sm text-slate-400 hover:text-slate-200"
            onClick={() => onClear?.()}
            disabled={!onClear}
            title="Clear this shift"
          >
            Clear
          </button>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-white text-slate-900 text-sm font-semibold disabled:opacity-50"
              disabled={!!error || !start || !end}
              onClick={() => {
                onSave({
                  start: normaliseTimeInput(start),
                  end: normaliseTimeInput(end),
                });
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
