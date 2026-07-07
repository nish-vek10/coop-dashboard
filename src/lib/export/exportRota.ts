// src/lib/export/exportRota.ts

import XLSX from "xlsx-js-style";
import type { Employee, WeekRota } from "../../types/rota";
import { shiftHours, shiftPay } from "../time/shiftCalc";

type ExportArgs = {
  employees: Employee[];
  days: Date[];
  rota: WeekRota;
  weekLabel: string; // e.g. "Sunday 08th February 2026"
};

const HEADER_FILL = "1F2937"; // slate-800
const ACCENT_FILL = "0F766E"; // teal-700 (grand total row)
const BORDER_COLOR = "D1D5DB";

const thinBorder = {
  top: { style: "thin", color: { rgb: BORDER_COLOR } },
  bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
  left: { style: "thin", color: { rgb: BORDER_COLOR } },
  right: { style: "thin", color: { rgb: BORDER_COLOR } },
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayHeaderLabel(d: Date): string {
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return `${weekday} ${date}`;
}

function titleCell(text: string) {
  return {
    v: text,
    t: "s",
    s: {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "0B1224" } },
      alignment: { horizontal: "left", vertical: "center" },
    },
  };
}

function headerCell(text: string) {
  return {
    v: text,
    t: "s",
    s: {
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: HEADER_FILL } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: thinBorder,
    },
  };
}

function textCell(text: string, opts: { bold?: boolean } = {}) {
  return {
    v: text,
    t: "s",
    s: {
      font: { bold: !!opts.bold, sz: 10 },
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: thinBorder,
    },
  };
}

function shiftCell(text: string) {
  return {
    v: text,
    t: "s",
    s: {
      font: { sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: thinBorder,
    },
  };
}

function currencyCell(value: number, opts: { bold?: boolean; fillWhite?: boolean } = {}) {
  return {
    v: Math.round(value * 100) / 100,
    t: "n",
    z: '"£"#,##0.00',
    s: {
      font: { bold: !!opts.bold, sz: 10 },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    },
  };
}

function hoursCell(value: number, opts: { bold?: boolean } = {}) {
  return {
    v: Math.round(value * 100) / 100,
    t: "n",
    z: "0.00",
    s: {
      font: { bold: !!opts.bold, sz: 10 },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    },
  };
}

/** Builds and downloads a clean, professional .xlsx export of the visible week's rota + payroll. */
export function exportRotaToExcel({ employees, days, rota, weekLabel }: ExportArgs) {
  const headerRow = [
    headerCell("Employee"),
    headerCell("Pay Rate (£/hr)"),
    ...days.map((d) => headerCell(dayHeaderLabel(d))),
    headerCell("Total Hours"),
    headerCell("Total Pay (£)"),
  ];

  const rows: any[][] = [];
  let grandHours = 0;
  let grandPay = 0;

  for (const emp of employees) {
    const empRota = rota[emp.id] ?? {};
    let totalHours = 0;
    let totalPay = 0;

    const dayCells = days.map((d) => {
      const shift = empRota[ymd(d)];
      const hours = shiftHours(shift);
      const pay = shiftPay(shift, emp.payRate);
      totalHours += hours;
      totalPay += pay;

      if (!shift?.start || !shift?.end) return shiftCell("—");
      return shiftCell(`${shift.start} - ${shift.end}\n£${pay.toFixed(2)}`);
    });

    grandHours += totalHours;
    grandPay += totalPay;

    rows.push([
      textCell(`${emp.firstName} ${emp.lastName}`, { bold: true }),
      currencyCell(emp.payRate),
      ...dayCells,
      hoursCell(totalHours, { bold: true }),
      currencyCell(totalPay, { bold: true }),
    ]);
  }

  const showGrandTotal = employees.length > 1;

  const aoa: any[][] = [
    [titleCell(`Weekly Rota & Payroll — Week Starting ${weekLabel}`)],
    [],
    headerRow,
    ...rows,
  ];

  if (showGrandTotal) {
    const totalLabelRow = Array.from({ length: 2 + days.length }, (_, i) =>
      i === 0
        ? {
            v: "WEEKLY PAYOUT — ALL EMPLOYEES",
            t: "s",
            s: {
              font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: ACCENT_FILL } },
              alignment: { horizontal: "left", vertical: "center" },
              border: thinBorder,
            },
          }
        : {
            v: "",
            t: "s",
            s: { fill: { fgColor: { rgb: ACCENT_FILL } }, border: thinBorder },
          }
    );

    aoa.push([
      ...totalLabelRow,
      {
        ...hoursCell(grandHours, { bold: true }),
        s: {
          ...hoursCell(grandHours, { bold: true }).s,
          fill: { fgColor: { rgb: ACCENT_FILL } },
          font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        },
      },
      {
        ...currencyCell(grandPay, { bold: true }),
        s: {
          ...currencyCell(grandPay, { bold: true }).s,
          fill: { fgColor: { rgb: ACCENT_FILL } },
          font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        },
      },
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const numCols = 2 + days.length + 2;
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    ...(showGrandTotal
      ? [{ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: 1 + days.length } }]
      : []),
  ];

  ws["!cols"] = [
    { wch: 22 },
    { wch: 13 },
    ...days.map(() => ({ wch: 16 })),
    { wch: 12 },
    { wch: 14 },
  ];

  ws["!rows"] = aoa.map((_, i) => ({ hpt: i === 2 ? 28 : i === 0 ? 24 : 30 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Weekly Rota");

  const filename = `Weekly-Rota-Payroll_${ymd(days[0])}_to_${ymd(days[days.length - 1])}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
