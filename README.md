# 🛒 CO-OP Weekly Rota Dashboard

A modern, glass-themed weekly rota management system built for Co-Op Retail Express managers.

This dashboard allows managers to:

- View weekly employee schedules (Sunday → Saturday)
- Add / Edit / Delete employees
- Toggle Active / Inactive employees
- Add / Edit / Delete shifts via modal
- Automatically calculate weekly paid hours (excluding break)
- Navigate weeks via arrows + premium calendar popover
- Search employees instantly
- Maintain clean alphabetical ordering by SURNAME
- View contracted vs actual weekly hours
- Experience a modern glass UI with depth and gradient effects

---

# 🚀 Tech Stack

- **React 18**
- **TypeScript**
- **Vite**
- **TailwindCSS**
- **Supabase (PostgreSQL + REST API)**
- Custom date & time utilities
- Glass UI with backdrop blur & gradient overlays

---

# 📁 Project Structure

```
Co-op_WeeklyRota-Dashboard/
│
├── public/
│
├── src/
│ │
│ ├── app/
│ │ └── layout/
│ │ └── DashboardLayout.tsx
│ │
│ ├── components/
│ │ ├── common/
│ │ │ └── CalendarPopover.tsx
│ │ │
│ │ └── dashboard/
│ │ ├── RotaGrid.tsx
│ │ ├── ShiftModal.tsx
│ │ └── EmployeeModal.tsx
│ │
│ ├── lib/
│ │ ├── date/
│ │ │ └── week.ts
│ │ │
│ │ ├── time/
│ │ │ ├── shiftCalc.ts
│ │ │ └── time.ts
│ │ │
│ │ └── supabase/
│ │ └── client.ts
│ │
│ ├── types/
│ │ └── rota.ts
│ │
│ ├── main.tsx
│ └── index.css
│
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```


---

# 🧠 Core Architecture

## 1️⃣ DashboardLayout

Handles:
- Current week logic
- Week navigation (prev / next / this week)
- Calendar popover
- Gradient background
- Glass header
- Passing week days into `RotaGrid`

### Week Logic
- Uses `getSunday(baseDate)` to determine week start
- Uses `getWeekDays(baseDate)` to generate Sunday → Saturday array

---

## 2️⃣ RotaGrid

Handles:

### Employee Management

- Fetch employees from `coop.employees`
- Add employee (Supabase insert)
- Edit employee (Supabase update)
- Delete employee (Supabase delete)
- Active / Inactive toggle (live persisted to DB)
- Default new employees = Active
- Surname-first display format:

```yaml
SURNAME
FirstName
```

---

### Shift Management

- Fetch shifts for visible week
- Upsert shift (1 per employee per day)
- Delete shift
- Hydrate frontend week state
- Cross-midnight shift support
- Break capped (0–120 minutes)
- 15-minute snapping
- Validation for invalid time ranges

---

### Sticky Header System

- Scrollable grid container
- Sticky column header row
- Optimized for 50+ employees
- Uniform shift column widths (no distortion)

---

### Data Persistence Model

Employees and shifts are fully database-driven.

### Database Tables

#### `coop.employees`

| Column | Type |
|--------|------|
| id | uuid (PK) |
| first_name | text |
| last_name | text |
| contracted_minutes | integer |
| is_active | boolean |
| created_at | timestamptz |

#### `coop.shifts`

| Column | Type |
|--------|------|
| id | uuid (PK) |
| employee_id | uuid (FK → employees.id) |
| shift_date | date |
| start_time | text ("HH:MM") |
| end_time | text ("HH:MM") |
| break_minutes | integer |
| created_at | timestamptz |
| updated_at | timestamptz |

Constraint:
- One shift per employee per day

---

### State Structure (Frontend)

```ts
type WeekRota = {
  [employeeId: string]: {
    [dateKey: string]: Shift
  }
}

type Shift = {
  start: string;
  end: string;
  breakMins?: number;
}
```

---

## 3️⃣ ShiftModal

### **Features:**

- Start & End input 
- Break input (0–120 mins)
- Auto format time typing:
  - `900 → 09:00`
  - `915 → 09:15`
  - `1330 → 13:30`
- Snaps to 15-minute increments 
- Break defaults to 0 if blank 
- Displays:
  - `NO BREAK` if 0
  - `BREAK = 30 mins` if > 0
- Modal UX:
  - Click outside to close 
  - ESC closes 
  - Clear shift option 
  - Validation for invalid times

---

# 🎨 Design System

## Glass UI
- `bg-white/5`
- `backdrop-blur-xl`
- `border-white/10`
- Glow layers using blurred radial gradients 
- Shadow depth for floating effect

## Background
- Two-tone gradient:
```
from-[#0B1430]
via-[#070B18]
to-[#1A0B2E]
```

- With:

  - Cyan glow top-left 
  - Fuchsia glow bottom-right 
  - Subtle radial grid texture overlay

## Employee LIVE Badge

- Emerald tint 
- Soft glow 
- Inline beside employee name 
- Compact row height

---

# 🧮 Calculations

## Weekly Total

```
shiftPaidMinutes(shift)
```

- Converts HH:MM → minutes 
- Subtracts break 
- Aggregates across current week

---

# 📱 Responsive Behaviour

Desktop:
- Full grid 
- Glass table 
- Hover +Add indicator 
- Modal interactions

Mobile:

- Employee cards 
- Grid of days (2 per row)
- Functional but refinement deferred

---

# ✅ Completed Features

### Core System
- ✔ Week navigation (prev / next / this week)
- ✔ Premium calendar popover (month/year navigation)
- ✔ Sunday → Saturday week model
- ✔ Alphabetical employee sorting
- ✔ Sticky table header 
- ✔ Scroll container optimization 
- ✔ Search bar (centered)
- ✔ Uniform column sizing
- ✔ Employee row selection with deselect-on-empty-click
- ✔ Edit/Delete buttons auto-disable when nothing selected

### Employee Management (Database Driven)
- ✔ Add employee 
- ✔ Edit employee 
- ✔ Delete employee 
- ✔ Active / Inactive toggle 
- ✔ Default Active on creation 
- ✔ A–Z by surname 
- ✔ Auto-format names:
  - First name = Title Case 
  - Surname = FULL CAPS 
- ✔ Surname-first display format 
- ✔ Instant search filtering

### Shift Management (Database Driven)
- ✔ Save shift (upsert)
- ✔ Delete shift 
- ✔ Auto week reload 
- ✔ One shift per day constraint 
- ✔ 15-min snapping 
- ✔ Break validation 
- ✔ Cross-midnight support 
- ✔ Weekly totals calculation

### Calculations
- ✔ Weekly paid hours (live computed)
- ✔ Break deducted automatically
- ✔ Contracted vs actual weekly comparison

### UI / UX
- ✔ Glass UI theme
- ✔ Gradient background + depth layers
- ✔ Emerald LIVE badge
- ✔ Weekend column tint
- ✔ Hover "+ Add" indicator
- ✔ Improved delete confirmation modal

---

# 🔐 Next Phase (Stage 4)

## 🔒 Authentication + Proper RLS

The current system is fully database-connected but **not yet user-isolated**.

Next stage focuses on securing the application for production use.

---

## 1️⃣ Supabase Auth Integration

- Email / Password login
- Register page
- Session persistence
- Protected dashboard route
- Automatic session restore on refresh

---

## 2️⃣ Owner Isolation

Add `owner_id` to:

- `employees`
- `shifts`

Enforce: `owner_id = auth.uid()`


Enable:

- Row Level Security (RLS)
- Per-user data access policies

---

### 🎯 This Enables

- Multi-store capability  
- Private data per manager  
- Secure production deployment  
- True SaaS-ready architecture  

---

# 🏗 Production Roadmap

## Phase 1 — Auth & Security

- Supabase Auth
- RLS enforcement
- Route protection
- Remove public policies
- Login page 
- Register page 
- Human verification (Turnstile / reCAPTCHA)
- Remember Me token storage 
- Session management

## Phase 2 — UX Enhancements

- Toast notifications
- Loading skeletons
- Soft LIVE pulse animation
- Improved mobile layout
- Error handling refinement

## Phase 3 — Operational Features

- CSV export (weekly rota)
- Weekly summary print mode
- Role-based access (Assistant Manager / Viewer)
- Store-level configuration

## Phase 4 — Deployment

- `.env` environment variables
- Secure Supabase keys
- Netlify deployment
- Custom domain
- HTTPS enforced
- Production build optimisation

--- 

# 📦 Running Locally

```
npm install
npm run dev
```

Runs at:

```
http://localhost:5173
```

---

# 🧭 Design Philosophy

This dashboard follows:

- Minimal noise 
- Clean glass UI 
- Clear hierarchy 
- Professional retail management feel 
- Speed over clutter 
- Desktop-first build strategy

---

***END OF PROJECT***