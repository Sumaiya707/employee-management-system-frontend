# 🗺️ EMS Frontend — Plan

Statuses: Not Started, In Progress, Blocked, Implemented, Tested, Verified, Approved.

The frontend and the backend are separate repositories that make up **one** application. The backend's plan (permission catalogue, roles, rules, models) is in the backend repository: [PLAN.md](https://github.com/Sumaiya707/employee-management-system/blob/main/PLAN.md). Task IDs are shared between the two plans.

---

## 📋 Frontend tasks

| ID | Task | Depends on (backend) | Status |
|---|---|---|---|
| T8 | Frontend foundation: React 18, Tailwind, shadcn/ui, Router, Redux, RTK Query, Vite proxy | T1 | Not Started |
| T9 | Login page, session restore, forced password change, protected routes, Forbidden/Not Found | T3, T8 | Not Started |
| T10 | Dashboard layout: permission-based sidebar, topbar, mobile drawer | T9 | Not Started |
| T11 | Three role dashboards | T7, T10 | Not Started |
| T12 | Pages: Users (HR accounts), Roles & Permissions, Employees, My Profile | T4, T5, T6, T10 | Not Started |

Backend APIs for attendance (T7c) and leave (T7d) are also built; their pages still need frontend tasks.

T13 (Postman complete, three-role manual test run, docs final) stays in the backend plan and depends on T1–T12.

---

## 🔌 Connection to the backend (contract)

| Topic | Rule |
|---|---|
| API base | All endpoints are under `/api` ([API reference](https://github.com/Sumaiya707/employee-management-system/blob/main/docs/API.md)) |
| Development address | Backend `http://localhost:5000`, frontend `http://localhost:5173` (the backend's `CLIENT_URL`) |
| Calls | Vite proxy `/api` → `http://localhost:5000` is set up (`vite.config.js`), and `src/api/health.js` calls `/api/health` with `credentials: "include"`. Planned in T8: RTK Query `fetchBaseQuery({ baseUrl: "/api", credentials: "include" })` |
| Session | `HttpOnly` cookie `ems_token`, 30-minute sliding expiry; restore on page load with `GET /api/auth/me` |
| Responses | `{ success, message, data, meta }`; errors carry `data.errors.<field>` for form fields |
| Database | The frontend never talks to MongoDB, only to the API |

---

## 🧭 Sidebar and page rule (T10)

The frontend keeps one list of implemented pages, each with its required permission. The sidebar shows the pages whose permission is in `GET /api/auth/me` → `permissions`. Every page is also wrapped in a route guard, and the backend checks again, so hiding a link is never the only protection. If `mustChangePassword` is true, the frontend shows only the change-password screen (the backend enforces the same).
