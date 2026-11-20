# 🖥️ Employee Management System — Frontend

**React user interface for the Employee Management System (EMS): login, role-based dashboards, employees, attendance and leave.**

![React](https://img.shields.io/badge/React-19_(starter)-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-JSX-F7DF1E?logo=javascript&logoColor=black)
![Status](https://img.shields.io/badge/Status-Starter_page_only-orange)

> 🔗 **This is one half of one application.** All data comes from the EMS REST API in the backend repository: [employee-management-system](https://github.com/Sumaiya707/employee-management-system). The frontend never connects to MongoDB.

---

## 📚 Documentation

| Document | What it contains |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Frontend tasks (T8–T12), planned stack, page and sidebar rules |
| [Backend API reference](https://github.com/Sumaiya707/employee-management-system/blob/main/docs/API.md) | Every endpoint this frontend will call |
| [Backend README](https://github.com/Sumaiya707/employee-management-system/blob/main/README.md) | How to run the API and its databases |

---

## 📌 Current Status

> ⚠️ **The user interface is not built yet.** This repository holds the Vite + React starter plus a backend health check. Building the real frontend is task **T8** (see [docs/PLAN.md](docs/PLAN.md)).

| Part | Status |
|---|---|
| Vite + React project, ESLint, build | ✅ Works (`npm run dev`, `npm run build`) |
| Start page (`src/App.jsx`) | Calls `GET /api/health` through the Vite proxy (`src/api/health.js`) and shows **"Backend is running. Database: connected."**, the backend's error message for an HTTP error, or **"Backend problem: The backend did not answer ... Is it running?"** when the backend is down. T8 replaces this page |
| Vite proxy (`vite.config.js`) | ✅ `/api` → `http://localhost:5000` in development |
| Router, Redux Toolkit / RTK Query, Tailwind, shadcn/ui, React Hook Form, Zod, Recharts, Lucide, Sonner | ❌ Not installed yet (T8) |
| Login, dashboards, employee, attendance and leave pages | ❌ Not built yet (T9–T12) |

---

## 🚀 How It Works

```
Browser ── React app (http://localhost:5173)          ← this repository
              │  HTTP + JSON, cookies sent with credentials: "include"
              ▼
           EMS REST API (http://localhost:5000/api)    ← backend repository
              │
              ▼
           MongoDB Atlas
```

- **Login session:** the backend sets an `HttpOnly` cookie `ems_token`. JavaScript cannot read it; the browser sends it automatically when requests use `credentials: "include"`.
- **Who is logged in:** `GET /api/auth/me` returns the user, role and `permissions`. The planned sidebar shows only pages whose permission is in that list. The backend still checks every request.
- **CORS:** the backend accepts browser requests only from its `CLIENT_URL` setting, which is `http://localhost:5173` in development.

---

## 🛠️ Tech Stack

| Area | Installed now | Planned (T8) |
|---|---|---|
| UI library | React 19 (from the starter) | React 18 |
| Build tool | Vite 8 | Vite |
| Routing | — | React Router v6 |
| State and API calls | — | Redux Toolkit + RTK Query |
| Forms and validation | — | React Hook Form + Zod |
| Styling and components | Plain CSS | Tailwind CSS + shadcn/ui |
| Charts, icons, toasts | — | Recharts, Lucide, Sonner |
| Linting | ESLint 10 | ESLint |

---

## ⚙️ Installation

### Prerequisites
- Node.js and npm
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
3. Open http://localhost:5173.

No `.env` file is needed. In development the app calls `/api/...` and Vite forwards it to the backend:

| Setting | Where | Default | Purpose |
|---|---|---|---|
| `EMS_API_TARGET` | shell, when starting `npm run dev` | `http://localhost:5000` | Where the development proxy sends `/api` (e.g. a backend on another port) |
| `VITE_API_BASE_URL` | shell or `.env`, when building | `/api` | API address baked into a production build, e.g. `https://api.example.com/api` |

The dev server always uses port **5173** (`strictPort`), because the backend only accepts browser requests from its `CLIENT_URL`, `http://localhost:5173`.

**Why a proxy:** the browser only talks to `http://localhost:5173`. The login cookie and the backend's CORS and CSRF checks then work without hard-coding the backend address. Every request is sent with `credentials: "include"`, so the `HttpOnly` login cookie will be sent once login is built.

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

The backend must have `CLIENT_URL=http://localhost:5173` in its `.env`; otherwise the browser blocks the API calls (CORS).

---

## 📁 Project Structure

```
Employee-Management-System-Frontend/
├── 📄 index.html          HTML page that loads src/main.jsx
├── 📄 vite.config.js      Vite settings: React plugin, port 5173, /api proxy to the backend
├── 📄 eslint.config.js    ESLint rules
├── 📄 package.json        Scripts and dependencies
├── 📂 public/             Static files (favicon, icons)
├── 📂 src/
│   ├── 📄 main.jsx        Starts React and renders <App />
│   ├── 📄 App.jsx         Start page with the backend health check (replaced in T8)
│   ├── 📂 api/
│   │   └── 📄 health.js   GET /api/health: tells HTTP errors and "backend unreachable" apart
│   ├── 📄 App.css, index.css
│   └── 📂 assets/         Starter images
└── 📂 docs/
    └── 📄 PLAN.md         Frontend tasks and rules
```
