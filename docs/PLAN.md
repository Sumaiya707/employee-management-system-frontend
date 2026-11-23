# 🗺️ EMS Frontend — Plan

Statuses: Not Started, In Progress, Blocked, Implemented, Tested, Verified, Approved.

The frontend and the backend are separate repositories that make up **one** application. The backend's plan (permission catalogue, roles, rules, models) is in the backend repository: [PLAN.md](https://github.com/Sumaiya707/employee-management-system/blob/main/PLAN.md). Task IDs are shared between the two plans.

---

## 📋 Frontend tasks

| ID | Task | Depends on (backend) | Status |
|---|---|---|---|
| T8 | Foundation: Tailwind v4 (light + dark), shadcn-style components, React Router 8, Redux Toolkit + RTK Query, Vite proxy | T1 | Implemented |
| T9 | Login page, session restore, forced password change, protected routes, Forbidden / Not Found | T3, T8 | Implemented (login screens tested; real login not yet tested, see below) |
| T10 | App layout: permission-based sidebar, header, mobile drawer, theme toggle, logout | T9 | Implemented |
| T11 | Three role dashboards (`admin`, `organisation`, `personal` layouts of `GET /api/dashboard`) | T7, T10 | Implemented |
| T12 | Pages: My Profile, Employees, Attendance, Leave, User Accounts, Roles & Permissions | T4–T7d, T10 | Implemented |
| T12b | Per-user permission overrides page (`GET/PATCH /api/users/:id/permissions`) | T5 | Not Started |
| T12c | Departments and Designations pages; department and designation on the employee form, details, list (column + filter) and My Profile | T7e | Implemented |

**"Implemented" means built, linted and production-built.** Logged-in pages still need a manual run with real accounts for each role before they can be marked Tested (see the README checklist).

T13 (Postman complete, three-role manual test run, docs final) stays in the backend plan and depends on T1–T12.

---

## 🔌 Connection to the backend (contract)

| Topic | Rule |
|---|---|
| API base | All endpoints are under `/api` ([API reference](https://github.com/Sumaiya707/employee-management-system/blob/main/docs/API.md)) |
| Development address | Backend `http://localhost:5000`, frontend `http://localhost:5173` (the backend's `CLIENT_URL`) |
| Calls | One RTK Query API (`src/api/baseApi.js`): `fetchBaseQuery({ baseUrl: "/api", credentials: "include" })`; feature files inject their endpoints |
| Session | `HttpOnly` cookie `ems_token`, 30-minute sliding expiry; restored on page load with `GET /api/auth/me`, re-checked when the window regains focus. Nothing is stored in localStorage or sessionStorage |
| Session end | Any `401` (except login / me / logout) clears the session and the RTK Query cache and shows the login page with the backend's message |
| Rule P1 | A `403` carrying `errors.mustChangePassword` sends the user to `/change-password` |
| Responses | `{ success, message, data, meta }`; `data.errors.<field>` (dotted keys) are shown on the matching form fields. `5xx` details are never shown |
| Database | The frontend never talks to MongoDB, only to the API |

---

## 🧭 Sidebar and page rule (T10)

`src/config/navigation.js` lists the implemented pages, each with its required permission key. The sidebar shows the pages whose permission is in `GET /api/auth/me` → `permissions`. Every page route is also wrapped in `RequirePermission` with the same key (`src/routes/router.jsx`), and the backend checks again, so hiding a link is never the only protection. While `mustChangePassword` is true, only the change-password screen opens (the backend enforces the same).

Self-service actions (clock in/out, request leave) are shown only when `GET /api/profile` returns an employee record, because the backend refuses them for accounts without one (HR, Super Admin).

---

## 🚧 Backend features not available yet (no page built on purpose)

| Missing in the backend | Effect in the frontend |
|---|---|
| Activity log list endpoint (only dashboard sections exist) | Activity is shown on dashboards only; no Activity Log page |
| Reports API (`reports:view` exists, no routes) | No Reports page |
| Password reset by email / forgot password | No "Forgot password" link; administrators reset passwords |
| Leave balances / leave types management (`leave:manage` exists, no routes) | Leave types are the fixed backend list |
| Attendance and leave numbers in `GET /api/dashboard` | Dashboard cards use list endpoints' `meta.total` instead |
