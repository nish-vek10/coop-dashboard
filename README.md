# 🛒 CO-OP Weekly Rota Dashboard

A modern, glass-themed weekly rota management system built for Co-Op Retail Express managers.

This dashboard allows managers to:
- View weekly employee schedules (Sunday → Saturday)
- Add/edit/delete shifts via modal
- Automatically calculate weekly paid hours (excluding break)
- Navigate weeks via arrows + premium calendar popover
- Maintain clean alphabetical employee ordering
- View contracted vs actual weekly hours
- Experience a modern glass UI with depth and gradient effects

---

# 🚀 Tech Stack

- **React 18**
- **TypeScript**
- **Vite**
- **TailwindCSS**
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
│ │ └── ShiftModal.tsx
│ │
│ ├── lib/
│ │ ├── date/
│ │ │ └── week.ts
│ │ │
│ │ └── time/
│ │ ├── shiftCalc.ts
│ │ └── time.ts
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
- Employees (sorted A–Z)
- Weekly rota state (`WeekRota`)
- Modal state
- Weekly totals calculation
- Desktop + mobile layouts

### State Structure

```ts
type WeekRota = {
  [employeeId: string]: {
    [dateKey: string]: Shift
  }
}

type Shift = {
  start: string;     // "09:00"
  end: string;       // "17:00"
  breakMins?: number // 0-120 in 15min steps
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

- ✔ Week navigation 
- ✔ Premium calendar popover (month/year navigation)
- ✔ Alphabetical employee sorting
- ✔ Shift modal with validation
- ✔ Auto time formatting
- ✔ 15-min snapping
- ✔ Break capped at 2 hours
- ✔ Weekly totals calculation
- ✔ Glass UI theme
- ✔ Gradient background + depth layers
- ✔ Compact row spacing
- ✔ Emerald LIVE badge

---

# 🔐 Planned (Not Yet Implemented)

- Authentication (Login / Register)
- "Remember Me"
- Inactivity auto logout 
- Supabase backend 
- Database persistence 
- Add/Edit/Delete employees 
- Contracted hours locked at creation 
- Autosave to backend 
- Role-based access

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

# 🏗 Next Steps Before Going Live

## Phase 1 — Data Persistence

- Integrate Supabase 
- Create tables:
  - users 
  - employees 
  - shifts 
- Implement Row Level Security (RLS)

## Phase 2 — Authentication

- Login page 
- Register page 
- Human verification (Turnstile / reCAPTCHA)
- Remember Me token storage 
- Session management

## Phase 3 — Employee Management

- Add employee modal 
- Edit employee 
- Delete employee 
- Contracted hours locked 
- Real database persistence

## Phase 4 — UX Refinement

- Mobile layout redesign 
- Sticky table header 
- Weekend highlight tint 
- Subtle LIVE pulse 
- Soft row hover lighting

## Phase 5 — Production Setup

- Environment variables (.env)
- Supabase keys secured 
- Netlify deploy 
- Custom domain 
- HTTPS enforced

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