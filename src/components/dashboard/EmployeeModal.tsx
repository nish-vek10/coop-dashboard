// src/components/dashboard/EmployeeModal.tsx

import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  title?: string;
  initial?: {
    firstName: string;
    lastName: string;
    contractedMinutes: number;
  };
  onClose: () => void;
  onSave: (v: { firstName: string; lastName: string; contractedMinutes: number }) => void;
  onDelete?: () => void; // (we’ll use later for Delete)
};

function minutesFromHoursInput(raw: string): number | null {
  // Accepts: "39", "39.5", "16", "1.25"
  const s = raw.trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  // round to nearest 15 mins
  const mins = Math.round((n * 60) / 15) * 15;
  return mins;
}

function hoursLabelFromMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} hrs`;
  return `${h} hrs ${m} mins`;
}

export function EmployeeModal({ open, title, initial, onClose, onSave }: Props) {
  const isEdit = !!initial;

  const computedTitle = title ?? (isEdit ? "Edit Employee" : "Add Employee");
  const subtitle = isEdit ? "Update employee details." : "Add an employee to the rota.";
  const primaryLabel = isEdit ? "Update" : "Save";

  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [hoursRaw, setHoursRaw] = useState(
    initial ? String((initial.contractedMinutes / 60).toFixed(2)).replace(/\.00$/, "") : ""
  );

  useEffect(() => {
    if (!open) return;
    setFirstName(initial?.firstName ?? "");
    setLastName(initial?.lastName ?? "");
    setHoursRaw(
      initial ? String((initial.contractedMinutes / 60).toFixed(2)).replace(/\.00$/, "") : ""
    );
  }, [open, initial?.firstName, initial?.lastName, initial?.contractedMinutes]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const contractedMinutes = useMemo(() => minutesFromHoursInput(hoursRaw), [hoursRaw]);

  const error = useMemo(() => {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (contractedMinutes == null) return "Contracted hours must be a number (e.g. 39 or 39.5).";
    if (contractedMinutes > 80 * 60) return "Contracted hours seems too high (max 80).";
    return "";
  }, [firstName, lastName, contractedMinutes]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1224]/95 backdrop-blur-2xl shadow-2xl shadow-black/70 overflow-hidden">
        {/* sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-white/0 opacity-40" />

        <div className="relative px-5 py-4 border-b border-white/10">
          <div className="text-base font-semibold text-slate-100">{computedTitle}</div>
          <div className="text-xs text-slate-300/70 mt-0.5">{subtitle}</div>
        </div>

        <div className="relative p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300/70 mb-1">First Name</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Aarav"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300/70 mb-1">Last Name</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Patel"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300/70 mb-1">
              Contracted Hours (per week)
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
              value={hoursRaw}
              onChange={(e) => setHoursRaw(e.target.value)}
              placeholder="e.g. 39 or 39.5"
              inputMode="decimal"
            />
            <div className="text-xs text-slate-300/70 mt-1">
              Stored as minutes:{" "}
              <span className="text-slate-100 font-semibold">
                {contractedMinutes == null
                  ? "—"
                  : `${contractedMinutes} mins (${hoursLabelFromMinutes(contractedMinutes)})`}
              </span>
            </div>
          </div>

          {error ? (
            <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>

        <div className="relative px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-white text-slate-900 text-sm font-semibold disabled:opacity-50"
            disabled={!!error}
            onClick={() => {
              onSave({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                contractedMinutes: contractedMinutes ?? 0,
              });
            }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
