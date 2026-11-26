# 🖥️ PeopleDesk — EMS Frontend

**React user interface for the Employee Management System (EMS): login, role-based dashboards, employees, attendance and leave.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-JSX-F7DF1E?logo=javascript&logoColor=black)
![Status](https://img.shields.io/badge/Status-In_development-orange)

> 🔗 **This is one half of one application.** All data comes from the EMS REST API in the backend repository: [employee-management-system](https://github.com/Sumaiya707/employee-management-system). The frontend never connects to MongoDB.

---

## 📚 Documentation

| Document | What it contains |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Frontend tasks and status, connection contract, sidebar rule, backend features not available yet |
| [docs/ASSETS.md](docs/ASSETS.md) | Source and licence of the login photograph |
| [Backend API reference](https://github.com/Sumaiya707/employee-management-system/blob/main/docs/API.md) | Every endpoint this frontend calls |
| [Backend README](https://github.com/Sumaiya707/employee-management-system/blob/main/README.md) | How to run the API and its databases |

---

## 📌 Current Status

> ⚠️ **Frontend development has started; the EMS is not complete.** The screens below are built against the real API. Logged-in screens have not yet been tested with real accounts (see the checklist at the end).

| Area | What works |
|---|---|
| Login | Split-screen page, email + password only, validation, show/hide password, backend error messages, "server unreachable" warning |
| Session | Restored with `GET /api/auth/me` on reload; ends cleanly on any `401`; logout waits for the backend |
| Forced password change | Users with `mustChangePassword` only see the change-password screen until they set their own password |
| Navigation | Sidebar (desktop) and drawer (mobile) show only pages allowed by the user's permissions; every route is guarded too |
| Dashboards | Super Admin (`admin`), HR (`organisation`) and Employee (`personal`) layouts from `GET /api/dashboard` |
| My Profile | Account and employment details; edit own phone, address, emergency contact; change password |
| Employees | List with search, filters (incl. department), sorting, pagination; details; create (with login account); edit, incl. department (optional), designation (required: the position; there is no separate job title) and job status (Active, Resigned or Terminated: Resigned and Terminated block login); On leave shown automatically from approved leave; reset password |
| Departments, Designations | List with search and status filter; HR / Super Admin: add, edit, activate / deactivate (never delete). Employees with the view permission see a read-only list |
| Attendance | Clock in / out (employees with a record); own or organisation records; HR correction with note |
| Leave | Request with an active leave type (its payment type and allowance are shown), counted in working days; cancel own pending request; HR review (approve / reject with note) |
| Leave balances | Table with allowance, used, pending and remaining per leave type and year (last / this / next year) on My Leave and, for HR / Super Admin, on the employee details page. The request form shows the available days and disables Submit when the request needs more days than are left, or a "per year" request crosses two years. The review dialog shows the balance and disables Approve when approved + pending days are over the current allowance (Reject stays available) |
| Leave Types, Work Calendar | Super Admin only (HR and employees do not see them and get Forbidden by URL): add, edit, activate / deactivate leave types (paid / unpaid, allowance rule); choose weekend days and add / remove holidays. Leave cannot be requested until the work calendar is saved |
| User Accounts | Super Admin: create, edit, reset password for HR and admin accounts; set an HR account to Active, Resigned or Terminated (Resigned and Terminated block login). Super Admin accounts always stay Active |
| Roles & Permissions | Super Admin: list, create custom roles, edit permissions and data scope, activate / deactivate custom roles |
| Theme | Light, dark and system mode, remembered in the browser |

Not built because the backend has no API for it yet: activity log page, reports, forgot password. See [docs/PLAN.md](docs/PLAN.md).

---

## 🚀 How It Works

```
Browser ── PeopleDesk (http://localhost:5173)          ← this repository
              │  /api/... with credentials: "include"
              │  (Vite dev proxy → backend)
              ▼
           EMS REST API (http://localhost:5000/api)    ← backend repository
              │
              ▼
           MongoDB Atlas
```

- **Login session:** the backend sets an `HttpOnly` cookie `ems_token`. JavaScript cannot read it, and the app never stores a token anywhere.
- **Who is logged in:** `GET /api/auth/me` returns the user, role and `permissions`. Pages and actions are shown from that list; the backend still checks every request.
- **Roles:** Super Admin, HR and Employee (custom roles also work, because everything is driven by permission keys, not role names).
- **CORS / CSRF:** the backend accepts browser requests only from its `CLIENT_URL`, `http://localhost:5173` in development.

---

## 🛠️ Tech Stack

| Area | Library |
|---|---|
| UI | React 19, JavaScript (JSX) |
| Build tool | Vite 8 (`@vitejs/plugin-react`) |
| Routing | React Router 8 (needs Node.js 22.22 or newer) |
| State and API calls | Redux Toolkit 2 + RTK Query |
| Forms and validation | React Hook Form 7 + Zod 4 (`@hookform/resolvers`) |
| Styling | Tailwind CSS 4 with colour tokens for light and dark mode (`src/index.css`) |
| Components | shadcn/ui-style components on Radix UI (`src/components/ui/`, `components.json`) |
| Charts | Recharts 3 (dashboard only, loaded on demand) |
| Icons, toasts | Lucide React, Sonner |
| Linting | ESLint 10 |

---

## ⚙️ Installation

### Prerequisites
- Node.js 22.22 or newer, and npm
- The EMS backend running (see the backend README), normally on http://localhost:5000

### Steps

1. **Install dependencies**
   ```bash
   cd E:\Employee-Management-System-Frontend
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
3. Open http://localhost:5173 and log in with an account from the backend.

No `.env` file is needed. In development the app calls `/api/...` and Vite forwards it to the backend:

| Setting | Where | Default | Purpose |
|---|---|---|---|
| `EMS_API_TARGET` | shell, when starting `npm run dev` | `http://localhost:5000` | Where the development proxy sends `/api` (e.g. a backend on another port) |
| `VITE_API_BASE_URL` | shell or `.env`, when building | `/api` | API address baked into a production build, e.g. `https://api.example.com/api` |

The dev server always uses port **5173** (`strictPort`), because the backend only accepts browser requests from its `CLIENT_URL`, `http://localhost:5173`. `.env` files are git-ignored.

---

## 📜 Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:5173 with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the `dist/` build locally |
| `npm run lint` | Run ESLint |

---

## ▶️ Running the Whole Application

Use two terminals (or open `E:\EMS-Workspace.code-workspace` in VS Code, which shows both folders):

```bash
# Terminal 1: backend API
cd E:\Employee-Management-System-Backend
npm run dev

# Terminal 2: frontend
cd E:\Employee-Management-System-Frontend
npm run dev
```

---

## 📁 Project Structure

```
src/
├── main.jsx, App.jsx        Start: Redux store, theme, router, toasts
├── index.css                Tailwind + light/dark colour tokens
├── app/                     Redux store, theme provider
├── api/                     baseApi.js (RTK Query, session handling), health.js
├── config/                  brand.js (name and wording), navigation.js (pages + permissions)
├── routes/                  router.jsx, guards.jsx (session, auth, permission), lazyPages.js
├── layouts/                 AppLayout, Sidebar, Header (user menu, theme, mobile drawer)
├── pages/                   Login, forced password change, status pages
├── features/
│   ├── auth/                authApi, authSlice, useSession, ChangePasswordForm
│   ├── dashboard/           DashboardPage (loads data, picks the dashboard), AdminDashboard,
│   │                        HrDashboard, EmployeeDashboard, SharedSections, widgets
│   ├── profile/             ProfilePage, profileApi, useOwnEmployee
│   ├── employees/           list, details, create/edit form, employeesApi
│   ├── attendance/          AttendancePage, TodayAttendanceCard, correction dialog
│   ├── leave/               LeavePage, request and review dialogs
│   ├── users/               UsersPage, account form
│   └── roles/               RolesPage, RoleFormPage
├── components/              Shared pieces (forms, tables, states, dialogs) and ui/ (shadcn-style)
├── hooks/                   useListParams (filters in the URL)
├── lib/                     apiError, format, validation (mirrors backend rules), permissions, theme
└── assets/                  login-workplace.jpg (CC0, see docs/ASSETS.md)
```

---

## ✅ Manual test checklist (with real accounts)

Run backend and frontend, then for **each role** (Super Admin, HR, Employee):

1. Log in → lands on the dashboard for that role; reload the page → still logged in.
2. The sidebar shows only that role's pages; opening another page's address shows "Access denied".
3. Employee: clock in / out, request and cancel leave, edit contact details.
4. HR: create an employee → log in as that employee → must set a new password first.
5. HR: review leave, correct attendance, set an employee to Resigned (login blocked) and back to Active (login restored).
6. Super Admin: create an HR account, set it to Terminated and back to Active, edit a role, deactivate a custom role.
7. Log out → back on the login page; the browser back button does not reopen the app.
8. Switch light / dark mode; try a phone-sized window.
