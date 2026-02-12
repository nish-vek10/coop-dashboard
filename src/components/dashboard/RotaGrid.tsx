// src/components/dashboard/RotaGrid.tsx

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../app/auth/AuthProvider";
import type { Employee, Shift, WeekRota } from "../../types/rota";
import { minutesToHHMM } from "../../lib/time/time";
import { shiftPaidMinutes } from "../../lib/time/shiftCalc";
import { ShiftModal } from "./ShiftModal";
import { supabase } from "../../lib/supabase/client";
import { EmployeeModal } from "./EmployeeModal";

type Props = { days: Date[] };

// ✅ local augmentation (does not require changing your shared types)
type EmployeeRow = Employee & { isActive: boolean };

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function employeeLabel(e: EmployeeRow): string {
  return `${e.lastName.toUpperCase()} - ${e.firstName}`;
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

/** First name: Title Case per word (handles spaces/hyphens) */
function formatFirstName(name: string): string {
  const cleaned = String(name ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => {
          const p = part.trim();
          if (!p) return "";
          const lower = p.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .filter(Boolean)
        .join("-")
    )
    .filter(Boolean)
    .join(" ");
}

/** Last name: FULL CAPS (keeps spaces/hyphens, normalizes spacing) */
function formatLastName(name: string): string {
  return String(name ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

export function RotaGrid({ days }: Props) {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // ✅ Search
  const [search, setSearch] = useState("");

  // ✅ Add Employee modal (create)
  const [empModalOpen, setEmpModalOpen] = useState(false);

  // ✅ Edit Employee modal state
  const [editEmpOpen, setEditEmpOpen] = useState(false);

  // ✅ Delete confirm modal state
  const [deleteEmpOpen, setDeleteEmpOpen] = useState(false);

  // ✅ selected employee (for edit/delete)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // ✅ rota cache (hydrated from Supabase shifts each week)
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

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => employeeLabel(e).toLowerCase().includes(q));
  }, [employees, search]);

  async function fetchEmployees() {
    if (!user?.id) return;

    setLoadingEmployees(true);

    const { data, error } = await supabase
      .schema("coop")
      .from("employees")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching employees:", error.message, error);
      setLoadingEmployees(false);
      return;
    }

    const mapped: EmployeeRow[] =
      data?.map((e: any) => {
        const rawFirst = String(e.first_name ?? "");
        const rawLast = String(e.last_name ?? "");

        return {
          id: e.id,
          firstName: formatFirstName(rawFirst),
          lastName: formatLastName(rawLast),
          contractedMinutes: e.contracted_minutes,
          // ✅ pull active flag from DB (defaults true if null)
          isActive: Boolean(e.is_active ?? true),
        };
      }) ?? [];

    // ✅ A–Z by surname (surname-first label)
    mapped.sort((a, b) => employeeLabel(a).localeCompare(employeeLabel(b)));

    setEmployees(mapped);
    setLoadingEmployees(false);

    if (selectedEmployeeId && !mapped.some((x) => x.id === selectedEmployeeId)) {
      setSelectedEmployeeId("");
    }
  }

  // ✅ When user changes, wipe local state so nothing "leaks" between sessions
  useEffect(() => {
    setEmployees([]);
    setRota({});
    setSelectedEmployeeId("");
    setSearch("");
  }, [user?.id]);

  // ✅ Fetch employees once auth is ready
  useEffect(() => {
    if (!user?.id) return;
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ✅ Fetch shifts for the visible week and hydrate WeekRota
  useEffect(() => {
    if (!days?.length) return;
    if (!user?.id) return;

    const start = ymd(days[0]);
    const end = ymd(days[days.length - 1]);

    (async () => {
      const { data, error } = await supabase
        .schema("coop")
        .from("shifts")
        .select("employee_id, shift_date, start_time, end_time, break_minutes")
        .eq("owner_id", user.id)
        .gte("shift_date", start)
        .lte("shift_date", end);

      if (error) {
        console.error("Error fetching shifts:", error.message, error);
        return;
      }

      const next: WeekRota = {};

      (data ?? []).forEach((r: any) => {
        const empId = String(r.employee_id);
        const dayKey = String(r.shift_date);
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
  }, [days, user?.id]);

  const currentShift: Shift | undefined =
    modal.open ? rota?.[modal.employeeId]?.[modal.dayKey] : undefined;

  function openModal(employeeId: string, dayKey: string) {
    setModal({ open: true, employeeId, dayKey });
  }

  function closeModal() {
    setModal({ open: false, employeeId: "", dayKey: "" });
  }

  async function saveShift(employeeId: string, dayKey: string, shift: Shift) {
    if (!user?.id) return;

    const payload = {
      owner_id: user.id,
      employee_id: employeeId,
      shift_date: dayKey,
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
      return;
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

  async function clearShift(employeeId: string, dayKey: string) {
    if (!user?.id) return;

    const { error } = await supabase
      .schema("coop")
      .from("shifts")
      .delete()
      .eq("owner_id", user.id)
      .eq("employee_id", employeeId)
      .eq("shift_date", dayKey);

    if (error) {
      console.error("Error deleting shift:", error.message, error);
      return;
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

  // ✅ Toggle Active/Inactive (persists to Supabase, safe + optimistic)
  async function toggleActive(employeeId: string, nextActive: boolean) {
    if (!user?.id) return;

    // optimistic UI
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, isActive: nextActive } : e))
    );

    const { error } = await supabase
      .schema("coop")
      .from("employees")
      .update({ is_active: nextActive })
      .eq("owner_id", user.id)
      .eq("id", employeeId);

    if (error) {
      console.error("Error updating active status:", error.message, error);
      // revert UI if DB fails
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, isActive: !nextActive } : e))
      );
    }
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

  if (loadingEmployees) {
    return <div className="mt-6 text-slate-400">Loading employees...</div>;
  }

  return (
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
          if (!user?.id) return;

          const fn = formatFirstName(firstName);
          const ln = formatLastName(lastName);

          const { error } = await supabase
            .schema("coop")
            .from("employees")
            .insert({
              owner_id: user.id,
              first_name: fn,
              last_name: ln,
              contracted_minutes: contractedMinutes,
              is_active: true, // ✅ default ON
            });

          if (error) {
            console.error("Error inserting employee:", error.message, error);
            return;
          }

          setEmpModalOpen(false);
          await fetchEmployees();
        }}
      />

      {/* ✅ Edit Employee Modal (UPDATE) */}
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
          if (!user?.id) return;
          if (!selectedEmployeeId) return;

          const fn = formatFirstName(firstName);
          const ln = formatLastName(lastName);

          const { error } = await supabase
            .schema("coop")
            .from("employees")
            .update({
              first_name: fn,
              last_name: ln,
              contracted_minutes: contractedMinutes,
            })
            .eq("owner_id", user.id)
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
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-500/15 hover:bg-red-500/25 border border-red-400/40 text-red-200"
                onClick={async () => {
                  if (!user?.id) return;
                  if (!selectedEmployeeId) return;

                  const { error } = await supabase
                    .schema("coop")
                    .from("employees")
                    .delete()
                    .eq("owner_id", user.id)
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

      {/* ✅ Controls Row: Center search + Right buttons */}
      <div
        className="mb-3 grid grid-cols-[1fr_minmax(260px,520px)_1fr] items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div />

        <div className="flex justify-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Employees by NAME…"
            className={[
              "w-full rounded-xl px-4 py-2.5 text-sm",
              "bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-400",
              "backdrop-blur-xl outline-none",
              "focus:border-amber-300/30 focus:ring-2 focus:ring-amber-300/10",
            ].join(" ")}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
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
      </div>

      {/* Desktop */}
      <div
        className="hidden md:block rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[calc(100vh-260px)] overflow-auto rounded-xl">
          <div className="sticky top-0 z-30 grid grid-cols-[340px_110px_110px_repeat(7,minmax(110px,1fr))] border-b border-white/10 bg-[#0B1224]/95 backdrop-blur-2xl">
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

          {filteredEmployees.map((e) => {
            const totalMins = weeklyTotalMinutes(e.id);
            const selected = selectedEmployeeId === e.id;

            return (
              <div
                key={e.id}
                onClick={() => setSelectedEmployeeId(e.id)}
                className={[
                  "grid grid-cols-[340px_110px_110px_repeat(7,minmax(110px,1fr))] border-b border-white/10 last:border-b-0",
                  "cursor-pointer transition-colors",
                  selected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                ].join(" ")}
              >
                <Cell className="pl-5">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1" title={employeeLabel(e)}>
                      <div className="text-[16px] font-semibold tracking-wide truncate leading-5">
                        {e.lastName.toUpperCase()}
                      </div>
                      <div className="text-[15px] font-medium text-slate-350 truncate leading-5">
                        {e.firstName}
                      </div>
                    </div>

                    {/* ✅ Active/Inactive Toggle (between name and LIVE) */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <button
                        type="button"
                        aria-pressed={e.isActive}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          toggleActive(e.id, !e.isActive);
                        }}
                        className={[
                          "relative inline-flex h-5 w-10 items-center rounded-full border",
                          "transition-colors",
                          e.isActive
                            ? "bg-emerald-400/15 border-emerald-400/30"
                            : "bg-red-500/15 border-red-400/30",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-block h-4 w-4 rounded-full bg-white/80 shadow-sm",
                            "transition-transform",
                            e.isActive ? "translate-x-[20px]" : "translate-x-[2px]",
                          ].join(" ")}
                        />
                      </button>
                      <span className="text-[10px] leading-none text-slate-400">
                        {e.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* ✅ LIVE badge turns RED when inactive */}
                    <span
                      className={[
                        "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold shadow-[0_0_14px_rgba(16,185,129,0.25)]",
                        e.isActive
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                          : "border-red-400/35 bg-red-500/10 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.20)]",
                      ].join(" ")}
                    >
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

          {filteredEmployees.length === 0 && (
            employees.length === 0 && !search.trim() ? (
              // ✅ Empty state for brand-new accounts (no employees at all)
              <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
                <div className="text-slate-300 font-semibold mb-3">
                  No Employees yet.
                </div>

                <button
                  className={[
                    "px-5 py-2.5 rounded-lg text-sm font-bold",
                    "border border-amber-300/30 bg-amber-300/10 text-amber-100",
                    "hover:bg-amber-300/15 shadow-[0_0_18px_rgba(251,191,36,0.12)]",
                    "backdrop-blur-xl",
                  ].join(" ")}
                  onClick={() => setEmpModalOpen(true)}
                >
                  + Add Employee
                </button>

                <div className="mt-3 text-xs text-slate-400">
                  Add your first employee to start building the rota.
                </div>
              </div>
            ) : (
              // ✅ Normal search-empty state
              <div className="px-5 py-10 text-center text-slate-400">
                No Match for “{search.trim()}”.
              </div>
            )
          )}

        </div>
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
          <div className="text-xs text-slate-400">{breakPretty(shift!.breakMins)}</div>
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
