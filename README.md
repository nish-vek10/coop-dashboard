# 🛒 CO-OP Weekly Rota Dashboard

A secure, glass-themed weekly rota management system built for Co-Op Retail Express managers.

This project evolved from a simple rota grid into a production-ready, multi-user, secure web application powered by Supabase and deployed on Netlify.

**Live Deployment:**
👉 https://coop-rota.netlify.app/

---

# 📖 Project Story

The goal was simple:

Build a clean, modern weekly rota dashboard for retail managers.

But the vision expanded into:

- Secure multi-user isolation
- Production-grade authentication
- Automatic inactivity logout
- Professional UI/UX
- Glass-themed design system
- SaaS-ready architecture

This README documents the **final production state** of the project.

---

# 🚀 Tech Stack

Frontend:
- React 18
- TypeScript
- Vite
- TailwindCSS

Backend:
- Supabase (PostgreSQL)
- Supabase Auth
- Row Level Security (RLS)

Deployment:
- Netlify
- GitHub CI integration

---


# 🔐 Security Architecture (Production Ready)

This application is fully secured.

## 1️⃣ Authentication

- Email + Password login
- Email confirmation required
- Protected routes via `RequireAuth`
- Automatic session restore
- Proper logout handling

## 2️⃣ Owner-Based Data Isolation

Both tables include:

`owner_id uuid`


All data access is restricted using Supabase RLS:

`owner_id = auth.uid()`


This guarantees:

- Each manager sees only their own employees
- Each manager sees only their own shifts
- Zero cross-account data exposure

## 3️⃣ Inactivity Auto Logout System

Security enhancement implemented:

- Idle timer starts when user is logged in
- After inactivity threshold → modal appears:
  - “Are you still here?”
  - Countdown timer
- User can:
  - Return (continue session)
  - Log Out
- If countdown reaches 0 → automatic logout
- Closing tab = session ends
- Timers fully cleared on logout

This prevents session exposure on shared devices.

---

## 4️⃣ ShiftModal

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

# 🧠 Core Features

## Employee Management

- Add employee
- Edit employee
- Delete employee
- Active / Inactive toggle
- Alphabetical A–Z by surname
- Surname in FULL CAPS
- First name Title Case
- Live search filtering

## Shift Management

- One shift per employee per day
- Upsert model (no duplicates)
- Break minutes validation
- 15-minute snapping
- Cross-midnight support
- Weekly paid hours auto-calculated

## Calculations - Weekly Total

```
shiftPaidMinutes(shift)
```

- Converts HH:MM → minutes 
- Subtracts break 
- Aggregates across current week

## Weekly Navigation

- Sunday → Saturday model
- Previous week
- Next week
- Jump to this week
- Premium calendar popover

## UI / UX

- Glass theme
- Depth layers
- Cyan & Fuchsia glow system
- Sticky header grid
- Scroll container optimisation
- Professional modal system
- Responsive layout (desktop-first)

---

# 👋 Greeting System

Upon login, header displays:

- Good Morning NAME
- Good Afternoon NAME
- Good Evening NAME

Rules:
- Before 12pm → Morning
- 12pm–5pm → Afternoon
- After 5pm → Evening
- First name auto-extracted from user metadata
- Displayed in uppercase
- Subtle glow effect applied

---

# 🗂 Database Schema

Schema: `coop`

## employees

| Column | Type |
|--------|------|
| id | uuid (PK) |
| owner_id | uuid |
| first_name | text |
| last_name | text |
| contracted_minutes | integer |
| is_active | boolean |
| created_at | timestamptz |

## shifts

| Column | Type |
|--------|------|
| id | uuid (PK) |
| owner_id | uuid |
| employee_id | uuid |
| shift_date | date |
| start_time | text |
| end_time | text |
| break_minutes | integer |
| created_at | timestamptz |
| updated_at | timestamptz |

Constraint:
- One shift per employee per day

---

# 🏗 Folder Structure

---


```
Co-op_WeeklyRota-Dashboard/
│
├── public/
│
├── src/
│ │
│ ├── app/
│ │ ├── auth/
│ │ ├── AuthProvider.tsx
│ │ ├── RequireAuth.tsx
│ │ ├── LoginPage.tsx
│ │ └── RegisterPage.tsx
│ │
│ │ ├── layout/
│ │   └── DashboardLayout.tsx
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

# 🌐 Deployment (Netlify)

Environment variables required:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Supabase settings required:

Authentication → URL Configuration:

- Site URL = Netlify domain
- Redirect URLs include:
  - http://localhost:5173/*
  - https://your-netlify-domain/*

---

# 📈 Production Status

Current State: ✅ LIVE

- Auth secured
- RLS enforced
- Session protection implemented
- Inactivity logout active
- Multi-user isolation confirmed
- GitHub integrated
- Netlify auto-deploy enabled

---

# 🎯 Future Enhancements

Potential expansion:

- CSV export
- Print-ready rota mode
- Store profile settings
- Role-based access (Manager / Viewer)
- Audit logs
- Multi-store SaaS expansion
- Shift templates
- Email rota distribution

---

# 🧭 Design Philosophy

This system was built with:

- Clarity over clutter
- Security first
- Desktop-first retail workflow
- Glass UI depth & polish
- Performance and scalability in mind
- SaaS-ready architecture from foundation

---

# 🏁 Final Notes

This is no longer just a rota grid.

It is a secure, production-grade rota management system suitable for:

- Retail managers
- Small store chains
- Multi-location teams
- SaaS expansion model

Built cleanly.
Structured properly.
Secured correctly.
Deployable confidently.

---

***END OF PROJECT***