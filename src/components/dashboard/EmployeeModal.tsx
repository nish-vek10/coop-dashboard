// src/components/dashboard/EmployeeModal.tsx

import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  title?: string;
  initial?: {
    firstName: string;
    lastName: string;
    payRate: number;
  };
  onClose: () => void;
  onSave: (v: { firstName: string; lastName: string; payRate: number }) => void;
  onDelete?: () => void;
};

function parsePayRateInput(raw: string): number | null {
  // Accepts: "5", "5.50", "12,50"
  const s = raw.trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function EmployeeModal({ open, title, initial, onClose, onSave }: Props) {
  const isEdit = !!initial;

  const computedTitle = title ?? (isEdit ? "Edit Employee" : "Add Employee");
  const subtitle = isEdit ? "Update employee details." : "Add an employee to the rota.";
  const primaryLabel = isEdit ? "Update" : "Save";

  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [payRateRaw, setPayRateRaw] = useState(
    initial ? String(initial.payRate ?? "") : ""
  );

  useEffect(() => {
    if (!open) return;
    setFirstName(initial?.firstName ?? "");
    setLastName(initial?.lastName ?? "");
    setPayRateRaw(initial ? String(initial.payRate ?? "") : "");
  }, [open, initial?.firstName, initial?.lastName, initial?.payRate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const payRate = useMemo(() => parsePayRateInput(payRateRaw), [payRateRaw]);

  const error = useMemo(() => {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (payRate == null) return "Pay rate must be a number (e.g. 5 or 11.50).";
    if (payRate <= 0) return "Pay rate must be greater than £0.00.";
    if (payRate > 500) return "Pay rate seems too high (max £500/hr).";
    return "";
  }, [firstName, lastName, payRate]);

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
              Agreed Pay Rate (£ per hour)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                £
              </span>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-7 pr-3 py-2 text-sm outline-none focus:border-white/25"
                value={payRateRaw}
                onChange={(e) => setPayRateRaw(e.target.value)}
                placeholder="e.g. 11.50"
                inputMode="decimal"
              />
            </div>
            <div className="text-xs text-slate-300/70 mt-1">
              Used to calculate earnings on every shift:{" "}
              <span className="text-slate-100 font-semibold">
                {payRate == null ? "—" : `£${payRate.toFixed(2)} / hr`}
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
                payRate: payRate ?? 0,
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
