// src/components/dashboard/RotaGrid.tsx

import { useEffect, useMemo, useState } from "react";
import type { Employee, Shift, WeekRota } from "../../types/rota";
import { minutesToHHMM } from "../../lib/time/time";
import { shiftPaidMinutes } from "../../lib/time/shiftCalc";
import { ShiftModal } from "./ShiftModal";
import { supabase } from "../../lib/supabase/client";
import { EmployeeModal } from "./EmployeeModal";

type Props = { days: Date[] };

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function employeeLabel(e: Employee): string {
  return `${e.firstName} ${e.lastName}`;
}

function breakPretty(mins?: number) {
  const m = Math.max(0, Number(mins ?? 0));
  if (m === 0) return "NO BREAK";
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `BREAK = ${r}m`;
  if (r === 0) return `BREAK = ${h}h`;
  return `BREAK = ${h}h ${r}m`;
}

export function RotaGrid({ days }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // ✅ Add Employee modal (create)
  const [empModalOpen, setEmpModalOpen] = useState(false);

  // ✅ Edit Employee modal state
  const [editEmpOpen, setEditEmpOpen] = useState(false);

  // ✅ Delete confirm modal state
  const [deleteEmpOpen, setDeleteEmpOpen] = useState(false);

  // ✅ selected employee (for edit/delete)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // ✅ rota cache (NOW hydrated from Supabase shifts each week)
  const [rota, setRota] = useState<WeekRota>({});

  const [modal, setModal] = useState<{
    open: boolean;
    employeeId: string;
    dayKey: string;
  }>({
    open: false,
    employeeId: "",
    dayKey: "",
  });

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  // ✅ Extract fetchEmployees so we can refresh after insert/update/delete
  async function fetchEmployees() {
    setLoadingEmployees(true);

    const { data, error } = await supabase
      .schema("coop")
      .from("employees")
      .select("*")
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Error fetching employees:", error.message, error);
      setLoadingEmployees(false);
      return;
    }

    const mapped: Employee[] =
      data?.map((e: any) => ({
        id: e.id,
        firstName: e.first_name,
        lastName: e.last_name,
        contractedMinutes: e.contracted_minutes,
      })) ?? [];

    mapped.sort((a, b) => employeeLabel(a).localeCompare(employeeLabel(b)));

    setEmployees(mapped);
    setLoadingEmployees(false);

    // if selected employee no longer exists, clear selection
    if (selectedEmployeeId && !mapped.some((x) => x.id === selectedEmployeeId)) {
      setSelectedEmployeeId("");
    }
  }

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ NEW: Fetch shifts for the visible week and hydrate WeekRota
  useEffect(() => {
    if (!days?.length) return;

    const start = ymd(days[0]);
    const end = ymd(days[days.length - 1]);

    (async () => {
      const { data, error } = await supabase
        .schema("coop")
        .from("shifts")
        .select("employee_id, shift_date, start_time, end_time, break_minutes")
        .gte("shift_date", start)
        .lte("shift_date", end);

      if (error) {
        console.error("Error fetching shifts:", error.message, error);
        return;
      }

      const next: WeekRota = {};

      (data ?? []).forEach((r: any) => {
        const empId = String(r.employee_id);
        const dayKey = String(r.shift_date); // already "YYYY-MM-DD"
        const shift: Shift = {
          start: String(r.start_time ?? ""),
          end: String(r.end_time ?? ""),
          breakMins: Number(r.break_minutes ?? 0),
        };
        if (!next[empId]) next[empId] = {};
        next[empId]![dayKey] = shift;
      });

      setRota(next);
    })();
  }, [days]);

  const currentShift: Shift | undefined =
    modal.open ? rota?.[modal.employeeId]?.[modal.dayKey] : undefined;

  function openModal(employeeId: string, dayKey: string) {
    setModal({ open: true, employeeId, dayKey });
  }

  function closeModal() {
    setModal({ open: false, employeeId: "", dayKey: "" });
  }

  // ✅ NEW: Persist shift to Supabase then update local cache
  async function saveShift(employeeId: string, dayKey: string, shift: Shift) {
    const payload = {
      employee_id: employeeId,
      shift_date: dayKey, // YYYY-MM-DD
      start_time: shift.start,
      end_time: shift.end,
      break_minutes: Math.max(0, Number(shift.breakMins ?? 0)),
    };

    const { error } = await supabase
      .schema("coop")
      .from("shifts")
      .upsert(payload, { onConflict: "employee_id,shift_date" });

    if (error) {
      console.error("Error saving shift:", error.message, error);
      return; // don't close modal; user can retry
    }

    setRota((prev) => {
      const next = { ...prev };
      const emp = { ...(next[employeeId] ?? {}) };
      emp[dayKey] = shift;
      next[employeeId] = emp;
      return next;
    });

    closeModal();
  }

  // ✅ NEW: Delete shift from Supabase then update local cache
  async function clearShift(employeeId: string, dayKey: string) {
    const { error } = await supabase
      .schema("coop")
      .from("shifts")
      .delete()
      .eq("employee_id", employeeId)
      .eq("shift_date", dayKey);

    if (error) {
      console.error("Error deleting shift:", error.message, error);
      return; // don't close modal; user can retry
    }

    setRota((prev) => {
      const next = { ...prev };
      const emp = { ...(next[employeeId] ?? {}) };
      delete emp[dayKey];
      next[employeeId] = emp;
      return next;
    });

    closeModal();
  }

  function weeklyTotalMinutes(employeeId: string): number {
    const emp = rota?.[employeeId] ?? {};
    let sum = 0;
    for (const d of days) sum += shiftPaidMinutes(emp[ymd(d)]);
    return sum;
  }

  const modalEmployee = employees.find((x) => x.id === modal.employeeId);
  const modalDay = modal.open ? new Date(modal.dayKey + "T00:00:00") : null;
  const modalDayLabel = modalDay
    ? modalDay.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  const modalTitle = modalEmployee
    ? `${employeeLabel(modalEmployee)} • ${modalDayLabel}`
    : `Shift • ${modal.dayKey}`;

  // ✅ LOADING STATE
  if (loadingEmployees) {
    return <div className="mt-6 text-slate-400">Loading employees...</div>;
  }

  return (
    // ✅ Make the container tall so the "empty space" is actually clickable
    <div
      className="mt-6 min-h-[70vh]"
      onClick={() => {
        if (!modal.open && !empModalOpen && !editEmpOpen && !deleteEmpOpen) {
          setSelectedEmployeeId("");
        }
      }}
    >
      <ShiftModal
        open={modal.open}
        title={modalTitle}
        initial={currentShift}
        onClose={closeModal}
        onSave={(s) => saveShift(modal.employeeId, modal.dayKey, s)}
        onClear={() => clearShift(modal.employeeId, modal.dayKey)}
      />

      {/* ✅ Add Employee Modal (CREATE) */}
      <EmployeeModal
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        onSave={async ({ firstName, lastName, contractedMinutes }) => {
          const { error } = await supabase
            .schema("coop")
            .from("employees")
            .insert({
              first_name: firstName,
              last_name: lastName,
              contracted_minutes: contractedMinutes,
              is_active: true,
            });

          if (error) {
            console.error("Error inserting employee:", error.message, error);
            return;
          }

          setEmpModalOpen(false);
          await fetchEmployees(); // refresh list
        }}
      />

      {/* ✅ Edit Employee Modal (UPDATE) - reuses EmployeeModal */}
      <EmployeeModal
        open={editEmpOpen}
        onClose={() => setEditEmpOpen(false)}
        initial={
          selectedEmployee
            ? {
                firstName: selectedEmployee.firstName,
                lastName: selectedEmployee.lastName,
                contractedMinutes: selectedEmployee.contractedMinutes,
              }
            : undefined
        }
        onSave={async ({ firstName, lastName, contractedMinutes }) => {
          if (!selectedEmployeeId) return;

          const { error } = await supabase
            .schema("coop")
            .from("employees")
            .update({
              first_name: firstName,
              last_name: lastName,
              contracted_minutes: contractedMinutes,
            })
            .eq("id", selectedEmployeeId);

          if (error) {
            console.error("Error updating employee:", error.message, error);
            return;
          }

          setEditEmpOpen(false);
          await fetchEmployees();
        }}
      />

      {/* ✅ Delete Confirm Modal */}
      {deleteEmpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDeleteEmpOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1224]/90 backdrop-blur-2xl shadow-2xl shadow-black/70 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-white/0 opacity-35" />
            <div className="relative px-5 py-4 border-b border-white/10">
              <div className="text-base font-semibold text-slate-100">
                Delete Employee from the System?
              </div>

              {/* ✅ Even bigger confirmation text */}
              <div className="mt-2 text-[15px] leading-relaxed font-semibold text-slate-100">
                This will remove{" "}
                <span className="text-slate-50 underline decoration-white/15 underline-offset-2">
                  {selectedEmployee ? employeeLabel(selectedEmployee) : "this employee"}
                </span>{" "}
                from the dashboard.
              </div>
            </div>

            <div className="relative px-5 py-4 text-sm text-slate-200">
              Are you sure you want to continue?
            </div>

            <div className="relative px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                onClick={() => setDeleteEmpOpen(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded-lg font-semibold text-sm
                           bg-red-500/15 hover:bg-red-500/25 border border-red-400/40 text-red-200"
                onClick={async () => {
                  if (!selectedEmployeeId) return;

                  const { error } = await supabase
                    .schema("coop")
                    .from("employees")
                    .delete()
                    .eq("id", selectedEmployeeId);

                  if (error) {
                    console.error("Error deleting employee:", error.message, error);
                    return;
                  }

                  setDeleteEmpOpen(false);
                  setSelectedEmployeeId("");
                  await fetchEmployees();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Top-right controls: Add / Edit / Delete */}
      <div
        className="mb-3 flex items-center justify-end gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={[
            "px-4 py-2 rounded-lg text-sm font-bold",
            "border border-amber-300/30 bg-amber-300/10 text-amber-100",
            "hover:bg-amber-300/15 shadow-[0_0_18px_rgba(251,191,36,0.12)]",
            "backdrop-blur-xl",
          ].join(" ")}
          onClick={() => setEmpModalOpen(true)}
        >
          + Add Employee
        </button>

        <button
          className={[
            "px-4 py-2 rounded-lg text-sm font-bold",
            "border border-amber-300/25 bg-white/5 text-amber-100",
            "hover:bg-white/10 shadow-[0_0_18px_rgba(251,191,36,0.10)]",
            "backdrop-blur-xl",
            "disabled:opacity-40 disabled:hover:bg-white/5",
          ].join(" ")}
          disabled={!selectedEmployeeId}
          onClick={() => setEditEmpOpen(true)}
          title={!selectedEmployeeId ? "Select an employee row first" : "Edit selected employee"}
        >
          Edit
        </button>

        <button
          className={[
            "px-4 py-2 rounded-lg text-sm font-bold",
            "border border-red-400/35 bg-red-500/10 text-red-200",
            "hover:bg-red-500/15 shadow-[0_0_18px_rgba(239,68,68,0.10)]",
            "backdrop-blur-xl",
            "disabled:opacity-40 disabled:hover:bg-red-500/10",
          ].join(" ")}
          disabled={!selectedEmployeeId}
          onClick={() => setDeleteEmpOpen(true)}
          title={!selectedEmployeeId ? "Select an employee row first" : "Delete selected employee"}
        >
          Delete
        </button>
      </div>

      {/* Desktop */}
      <div
        className="hidden md:block rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[260px_140px_140px_repeat(7,minmax(120px,1fr))] border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <HeaderCell className="pl-5">Employee</HeaderCell>
          <HeaderCell>Contract</HeaderCell>
          <HeaderCell>Total</HeaderCell>

          {days.map((d) => {
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <HeaderCell
                key={d.toISOString()}
                center
                className={isWeekend ? "bg-white/5" : ""}
              >
                {d.toLocaleDateString("en-GB", { weekday: "short" })}
                <div className="text-xs text-slate-400">
                  {d.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              </HeaderCell>
            );
          })}
        </div>

        {employees.map((e) => {
          const totalMins = weeklyTotalMinutes(e.id);
          const selected = selectedEmployeeId === e.id;

          return (
            <div
              key={e.id}
              onClick={() => setSelectedEmployeeId(e.id)}
              className={[
                "grid grid-cols-[260px_140px_140px_repeat(7,minmax(120px,1fr))] border-b border-white/10 last:border-b-0",
                "cursor-pointer transition-colors",
                selected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
              ].join(" ")}
            >
              <Cell className="pl-5">
                <div className="flex items-center gap-3">
                  <span
                    className="min-w-0 flex-1 font-semibold tracking-wide line-clamp-2"
                    title={employeeLabel(e)}
                  >
                    {employeeLabel(e)}
                  </span>

                  <span className="shrink-0 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.25)]">
                    ● LIVE
                  </span>
                </div>
              </Cell>

              <Cell>
                <div className="font-medium">{minutesToHHMM(e.contractedMinutes)}</div>
                <div className="text-xs text-slate-400">Contracted</div>
              </Cell>

              <Cell>
                <div className="font-medium text-slate-200">{minutesToHHMM(totalMins)}</div>
                <div className="text-xs text-slate-400">This week</div>
              </Cell>

              {days.map((d) => {
                const key = ymd(d);
                const s = rota?.[e.id]?.[key];
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                return (
                  <ShiftCell
                    key={key}
                    shift={s}
                    isWeekend={isWeekend}
                    onClick={() => openModal(e.id, key)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeaderCell({
  children,
  className = "",
  center = false,
}: {
  children: React.ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <div
      className={[
        "px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300",
        center ? "text-center" : "text-left",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Cell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={["px-3 py-3", className].join(" ")}>{children}</div>;
}

function ShiftCell({
  shift,
  onClick,
  isWeekend,
}: {
  shift?: Shift;
  onClick: () => void;
  isWeekend?: boolean;
}) {
  const has = !!(shift?.start && shift?.end);

  return (
    <button
      className={[
        "px-3 py-3 text-left border-l border-white/10 transition-colors relative group",
        isWeekend ? "bg-white/[0.03] hover:bg-white/[0.06]" : "hover:bg-white/5",
      ].join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {has ? (
        <div>
          <div className="text-sm font-semibold">
            {shift!.start} - {shift!.end}
          </div>
          <div className="text-xs text-slate-400">
            {breakPretty(shift!.breakMins)}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center">
          <div className="text-slate-600 text-lg leading-none">—</div>
          <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-900 px-2 py-1 rounded-md shadow-sm">
              + Add
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
