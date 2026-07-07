# 🗓 Weekly Rota & Payroll Dashboard

A modern, single-user rota and payroll tracker. Add employees with their agreed hourly
pay rate, key in shift start/end times across the week, and the dashboard automatically
works out what everyone has earned — per shift, per employee, and as a total weekly
payout — with a one-click Excel export.

No login, no sessions, no auto-logout: this is built to be run by one manager, so all
of that overhead has been stripped out.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Supabase Schema and Migration](#supabase-schema-and-migration)
- [Running Locally](#running-locally)
- [Testing Checklist](#testing-checklist)
- [Deploying to Netlify](#deploying-to-netlify)
- [Design Notes](#design-notes)
- [Explicitly Removed Features](#explicitly-removed-features)
- [Troubleshooting](#troubleshooting)

---

## What It Does

- Add / edit / delete employees — just **First name**, **Last name**, and their
  **agreed pay rate (£ per hour)**.
- Log shifts per employee, per day — **Start** and **End** time only (no break field).
- Every shift cell shows the hours worked and what was earned, calculated live as
  `(end − start) in hours × agreed pay rate`.
  e.g. £5/hr, 08:00–14:00 → **£30.00**.
- Each employee row totals their **hours** and **pay** for the visible week.
- When more than one employee is on the rota, a **Weekly Payout** row/card sums pay
  across everyone for that week.
- **Export to Excel** — one click produces a clean, formatted `.xlsx` of the visible
  week (employee, pay rate, daily shifts + earnings, weekly totals, grand payout).
- Full **desktop table** and **mobile card** layouts — same data, laid out properly
  for the screen size.
- Week navigation: ◀ / ▶ / This Week / calendar jump-to-date popover.

[⬆ back to top](#table-of-contents)

---

## Tech Stack

- React 19 + TypeScript + Vite
- TailwindCSS (glass UI, gradient background, dark theme)
- Supabase (Postgres) for persistence — no auth, single anon-key client
- `xlsx-js-style` for styled Excel export (client-side, no backend needed)

[⬆ back to top](#table-of-contents)

---

## Project Structure

```
Co-op_WeeklyRota-Dashboard/
├── supabase/
│   └── migration.sql            # Run once in Supabase SQL editor (see below)
├── src/
│   ├── app/
│   │   └── layout/
│   │       └── DashboardLayout.tsx   # Header, week nav, page shell
│   ├── components/
│   │   ├── common/
│   │   │   └── CalendarPopover.tsx   # Jump-to-week date picker
│   │   └── dashboard/
│   │       ├── RotaGrid.tsx          # Main table/cards, totals, export button
│   │       ├── EmployeeModal.tsx     # Add/Edit employee (name + pay rate)
│   │       └── ShiftModal.tsx        # Add/Edit shift (start/end + live earnings)
│   ├── lib/
│   │   ├── date/week.ts              # Week/Sunday-start date helpers
│   │   ├── time/
│   │   │   ├── shiftCalc.ts          # shiftMinutes / shiftHours / shiftPay
│   │   │   └── time.ts               # Formatting: HH:MM, hours label, £ currency
│   │   ├── export/exportRota.ts      # Builds + downloads the .xlsx export
│   │   └── supabase/client.ts        # Supabase client (anon key only)
│   ├── types/rota.ts                 # Employee / Shift / WeekRota types
│   └── main.tsx
├── tailwind.config.js
├── package.json
└── README.md
```

[⬆ back to top](#table-of-contents)

---

## Data Model

```ts
type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  payRate: number; // £ per hour, agreed rate keyed in on Add Employee
};

type Shift = {
  start?: string; // "HH:MM"
  end?: string;   // "HH:MM"
};

type WeekRota = {
  [employeeId: string]: {
    [dateKey: string /* YYYY-MM-DD */]: Shift;
  };
};
```

Payroll math lives in `src/lib/time/shiftCalc.ts`:

```ts
shiftMinutes(shift)              // worked minutes, handles overnight shifts
shiftHours(shift)                // worked minutes / 60
shiftPay(shift, payRate)         // shiftHours(shift) * payRate
```

[⬆ back to top](#table-of-contents)

---

## Supabase Schema and Migration

Tables live in the `rota` Postgres schema:

- `rota.employees` — `id, first_name, last_name, pay_rate, is_active`
- `rota.shifts` — `id, employee_id, shift_date, start_time, end_time`

### One-time migration

Run `supabase/migration.sql` once in your Supabase project's SQL editor (Project ▸ SQL
Editor ▸ New query) before using the app. This session has no DB admin credentials to
run it automatically — only the anon key. The script is idempotent (safe to re-run) and:

1. Renames schema `coop` → `rota`, **only if `coop` still exists** (skipped automatically
   if your schema is already called `rota`).
2. Adds `employees.pay_rate` (defaults existing rows to `0` — go back into each
   employee's Edit modal and set their real rate afterwards).
3. Drops `employees.contracted_minutes`.
4. Drops `shifts.break_minutes`.

Confirmed working: ran successfully on 2026-07-07, "No rows returned" (expected —
it's schema/DDL changes, not a data query).

[⬆ back to top](#table-of-contents)

---

## Running Locally

```bash
cd C:\Users\ravil\PycharmProjects\Co-op_WeeklyRota-Dashboard
npm install
npm run dev
```

Opens at `http://localhost:5173`. Requires `.env` in the project root with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Stop the server with `Ctrl+C` in the terminal.

To check the mobile layout on a phone: connect the phone to the same wifi as your PC,
find your PC's local IP (`ipconfig` on Windows), then run `npm run dev -- --host` and
visit `http://<your-pc-ip>:5173` from the phone browser instead of `localhost`.

[⬆ back to top](#table-of-contents)

---

## Testing Checklist

Run through this before trusting the data / deploying:

1. **Add Employee** — enter name + pay rate.
2. Click a day cell — enter start/end time. Confirm the earnings preview in the
   modal matches hours × pay rate.
3. Save. Confirm the shift cell on the grid shows the time range + £ earned.
4. Add a second employee, add shifts for them too. Confirm the **Weekly Payout** row
   appears at the bottom (only shows with 2+ employees).
5. Click **Export to Excel**. Open the downloaded file and confirm the totals match
   what's on screen exactly.
6. Resize the browser narrow (or open on a phone, see above). Confirm the mobile
   card layout renders cleanly — no overlapping text, all buttons tappable.
7. Navigate ◀ / ▶ / This Week / calendar popover — confirm shifts persist correctly
   per week and don't bleed into the wrong week.
8. Edit and delete an employee — confirm their shifts/totals update or clear correctly.

[⬆ back to top](#table-of-contents)

---

## Deploying to Netlify

`netlify.toml` is already configured (`npm run build` → publish `dist`, SPA redirect
to `index.html`). Push to your connected repo/branch and Netlify builds automatically.
Set the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as environment variables in
the Netlify site settings.

[⬆ back to top](#table-of-contents)

---

## Design Notes

- Glass UI: `bg-white/5`, `backdrop-blur-xl`, `border-white/10`, soft gradient glow
  layers, dark base (`#070B18` → `#0B1430` → `#1A0B2E`).
- Desktop: full data-grid table with sticky-feeling header row, hover states, and a
  teal "Weekly Payout" summary row when 2+ employees exist.
- Mobile (`< md`): per-employee cards, 2-up day grid, tap a day to open the shift
  modal, condensed header controls (icon-only week nav + "Today").
- Earnings are colour-coded emerald/teal throughout so pay figures are always the
  visual focal point of a row/card.

[⬆ back to top](#table-of-contents)

---

## Explicitly Removed Features

- Login / sign-out / session management — single-user tool, not needed.
- Inactivity auto-logout — no session to expire.
- Contracted hours field — replaced entirely by agreed pay rate + actual hours worked.
- Shift break field — shifts are now just Start → End.
- Encryption / Turnstile captcha — no auth surface to protect.

[⬆ back to top](#table-of-contents)

---

## Troubleshooting

**`ERROR: 3F000: schema "coop" does not exist` when running the migration.**
Your Postgres schema was already named `rota` (not `coop`), so the rename step in
older versions of `migration.sql` failed. Fixed in the current script — it checks
whether `coop` exists before attempting the rename, and skips it cleanly if not.
Pull the latest `supabase/migration.sql` and re-run.

**Employees show £0.00/hr after migrating.**
Expected — `pay_rate` defaults to `0` for pre-existing rows since the old schema had
no such column. Open each employee via **Edit** and set their real agreed rate.

[⬆ back to top](#table-of-contents)

---

***END OF PROJECT***
