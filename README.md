# Smart Lifting Optimizer

A full-stack, AI-assisted strength training application that automates workout scheduling, tracks progressive overload, manages live in-gym workout lifecycles, builds custom routines, and visualizes rolling muscle fatigue.

---

## Documentation Index

| Document | Purpose |
|---|---|
| **[docs/CODE_FLOW.md](docs/CODE_FLOW.md)** | End-to-end request/response lifecycles, state machines, sequence diagrams, and data flow |
| **[docs/USER_WORKFLOW.md](docs/USER_WORKFLOW.md)** | Step-by-step user journey, feature walkthrough, and manual QA verification checklist |
| **[docs/FILE_AND_CODE_MAPPING.md](docs/FILE_AND_CODE_MAPPING.md)** | Complete directory map, file-by-file responsibilities, exported symbols, API-to-code mapping, and DB schema map |
| **[docs/premium-color-theme-guide.md](docs/premium-color-theme-guide.md)** | Active design system: Midnight Slate (Dark) & Warm Porcelain (Light) tokens, contrast ratios, and typography |
| **[docs/original-color-theme-guide.md](docs/original-color-theme-guide.md)** | Archived snapshot of the original Electric Indigo & Deep Slate theme + 1-command revert instructions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, **shadcn/ui** (`@radix-ui/*` primitives + `cva` + `tailwind-merge`), Recharts, Lucide React, React Router v6 |
| **Backend** | Node.js (v18+), Express 4, `pg-promise`, `bcryptjs`, `jsonwebtoken`, `cookie-parser` |
| **Database** | PostgreSQL (Neon Serverless or local PostgreSQL 14+) |
| **AI Integration** | Google Gemini API (`gemini-2.0-flash` by default via REST) with deterministic rule-based fallbacks |
| **Testing & CI** | Jest (Backend Unit), Node Test Runner (Frontend Unit), Custom E2E Runner (`apitest.js`), GitHub Actions CI (`.github/workflows/ci.yml`) |
| **Typography & Theme** | `Fraunces` (headings) + `DM Sans` (body/tabular data) · Midnight Slate (`#15181D`) & Warm Porcelain (`#F4F2EE`) |

---

## Project Folder Structure

```text
smart-lifting-optimizer/
├── .github/
│   └── workflows/
│       └── ci.yml                             # GitHub Actions CI (Unit Tests + Vite Build + PostgreSQL 16 E2E Suite)
├── README.md                                  # Setup guide, folder structure & engineering Do's/Don'ts
├── docs/
│   ├── CODE_FLOW.md                           # End-to-end request/response flows & state machines
│   ├── USER_WORKFLOW.md                       # Step-by-step user guide & QA checklist
│   ├── FILE_AND_CODE_MAPPING.md               # Complete file, symbol, API & database schema reference
│   ├── premium-color-theme-guide.md           # Active theme spec (Midnight Slate & Warm Porcelain)
│   └── original-color-theme-guide.md          # Archived original theme spec (Electric Indigo)
├── backend/
│   ├── package.json                           # Backend dependencies & scripts (dev, start, test, test:api)
│   ├── .env.example                           # Environment variable template
│   ├── schema.sql                             # Complete PostgreSQL DDL schema
│   ├── seed.sql                               # 60+ seeded exercises across 9 muscle groups
│   ├── migrate.js                             # Applies schema.sql + seed.sql
│   ├── run-migration.js                       # Runs a specific SQL migration file
│   ├── apitest.js                             # 57-check automated E2E API test suite
│   ├── migrations/
│   │   ├── 002_phase2.sql                     # Phase 2 schema additions (set_type, workout_logs, workout_templates)
│   │   └── 003_workout_lifecycle.sql          # Workout lifecycle columns & uq_one_active_workout_per_user index
│   ├── tests/
│   │   ├── authAndMiddleware.test.js          # Jest unit tests for auth validation, JWT & error middleware
│   │   ├── progressiveOverloadService.test.js # Jest unit tests for overload math & AI bounds
│   │   ├── schedulingService.test.js          # Jest unit tests for 7-day slot scheduling algorithm
│   │   └── swapService.test.js                # Jest unit tests for exercise alternative scoring
│   └── src/
│       ├── index.js                           # Express app entrypoint & route mounting
│       ├── config/                            # Environment config (index.js) & pg-promise instance (db.js)
│       ├── middleware/                        # verifyToken.js & errorHandler.js
│       ├── models/                            # Database queries (user, exercise, workout, workoutSet, workoutLog, template, schedule, onerm)
│       ├── services/                          # Business logic (auth, onboarding, scheduling, progressiveOverload, swap, llm)
│       ├── controllers/                       # Express route handlers (auth, onboarding, schedule, workout, exercise, ai, analytics)
│       └── routes/                            # Express routers (/api/auth, /onboarding, /schedule, /workouts, /exercises, /ai, /templates, /analytics)
└── frontend/
    ├── package.json                           # Frontend dependencies & scripts (dev, build, preview, test)
    ├── components.json                        # shadcn/ui configuration
    ├── vite.config.js                         # Vite config with /api proxy -> http://localhost:3001
    ├── tailwind.config.js                     # CSS-variable color token mappings & font families
    ├── postcss.config.js                      # Tailwind + Autoprefixer PostCSS setup
    ├── index.html                             # HTML shell loading Fraunces & DM Sans fonts
    ├── tests/
    │   └── utils.test.js                      # Frontend unit tests for labels.js, workoutSets.js & cn.js
    └── src/
        ├── main.jsx                           # React root mounting BrowserRouter + App
        ├── App.jsx                            # Route definitions, ProtectedRoute, PublicRoute & TooltipProvider
        ├── index.css                          # Dark/Light CSS variables + base/component classes
        ├── api/                               # Axios client (client.js) & typed endpoint wrappers (endpoints.js)
        ├── context/                           # AuthContext.jsx & WorkoutContext.jsx
        ├── hooks/                             # useCountdown.js, usePersistentState.js, useProgressOverload.js
        ├── utils/                             # cn.js (shadcn class merger), labels.js, workoutSets.js
        ├── components/
        │   ├── layout/
        │   │   └── AppLayout.jsx              # Persistent desktop sidebar + mobile bottom nav + theme toggle
        │   ├── ui/                            # shadcn/ui & Radix UI primitives
        │   │   ├── Badge.jsx                  # cva Badge with status dot indicator
        │   │   ├── Button.jsx                 # cva + Radix Slot Button
        │   │   ├── Card.jsx                   # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
        │   │   ├── ConfirmDialog.jsx          # Radix AlertDialog modal
        │   │   ├── Input.jsx                  # Standardized input control
        │   │   ├── Label.jsx                  # Standardized form label
        │   │   ├── LoadingSpinner.jsx         # Full-screen loading state
        │   │   ├── Modal.jsx                  # Radix Dialog modal
        │   │   ├── Progress.jsx               # Radix Progress thin indicator bar
        │   │   ├── Tabs.jsx                   # Radix Tabs (Tabs, TabsList, TabsTrigger, TabsContent)
        │   │   ├── TimeInput.jsx              # Radix Popover 24h time picker + numeric inputs
        │   │   └── Tooltip.jsx                # Radix Tooltip (TooltipProvider, Tooltip, TooltipTrigger, TooltipContent)
        │   ├── dashboard/
        │   │   ├── MonthlyVolumeChart.jsx     # Recharts BarChart for 30-day weekly volume
        │   │   └── MuscleBodyMap.jsx          # Interactive Front/Back SVG muscle recovery heatmap
        │   └── workout/
        │       ├── SetRow.jsx                 # Individual set row (W/number, previous, kg, reps, lockable checkbox)
        │       ├── RestTimer.jsx              # Auto-triggered countdown bar beneath completed set
        │       ├── ExerciseNotes.jsx          # Collapsible debounced auto-save notes textarea
        │       ├── SwapModal.jsx              # Radix Tabs modal: AI Smart Swap + Manual Catalog Swap
        │       └── ExercisePicker.jsx         # Searchable, muscle-filtered exercise selector
        └── pages/
            ├── LoginPage.jsx                  # Sign-in page
            ├── RegisterPage.jsx               # Registration page with live password checklist
            ├── OnboardingPage.jsx             # 4-step wizard + completion screen
            ├── DashboardPage.jsx              # Command Center (Next Session / In-Progress HUD, stats, charts, body map)
            ├── WorkoutsPage.jsx               # Upcoming & active workouts grouped by week
            ├── WorkoutPage.jsx                # Live Training HUD & session lifecycle controller
            ├── TemplatesPage.jsx              # Custom split builder (FLIP reorder) + AI routine generator
            └── ProfilePage.jsx                # User details, Edit Profile modal, lifetime stats & collapsible history
```

---

## Future Setup Guide (From Scratch or New Machine)

### 1. Prerequisites
* **Node.js** `v18.0.0` or higher (`node -v`)
* **npm** `v9+`
* **PostgreSQL** instance (a [Neon](https://neon.tech) connection string or local PostgreSQL database)

### 2. Clone & Checkout Branch
```bash
git clone https://github.com/HiHelloHolaHey/smart-lifting-optimizer.git
cd smart-lifting-optimizer
git checkout develop
```

### 3. Backend Configuration & Database Setup
1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create `backend/.env` from `backend/.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Populate `backend/.env`:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
   JWT_SECRET=replace_with_a_long_random_secret_string
   JWT_EXPIRES_IN=7d
   NODE_ENV=development

   # Optional: Google Gemini API key for real AI Coach, Smart Swap, Overload & Routine Builder.
   # If omitted or invalid, the app automatically falls back to deterministic rule-based logic.
   LLM_API_KEY=
   LLM_MODEL=gemini-2.0-flash
   ```
4. Initialize the database schema, migrations, and 60+ exercise catalog:
   ```bash
   # If setting up a fresh database (applies schema.sql + seed.sql):
   node migrate.js

   # Or to apply incremental idempotent migrations on an existing DB:
   node run-migration.js migrations/002_phase2.sql
   node run-migration.js migrations/003_workout_lifecycle.sql
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```
   Verify health at `http://localhost:3001/api/health` → `{"status":"ok","timestamp":"..."}`.

### 4. Frontend Setup
1. Open a second terminal and install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite dev server (proxies `/api` requests to `http://localhost:3001`):
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### 5. Running the Automated E2E API Test Suite
With the backend server running on port `3001`:
```bash
cd backend
npm run test:api
```
This executes `backend/apitest.js` (57 end-to-end checks covering registration, login error codes, onboarding, profile edits, workout lifecycle, set locking, exercise add/remove/swap, templates, analytics, AI endpoints, and `.ics` calendar export).

---

## Engineering Do's and Don'ts

### 1. Git & Branching Workflow
* **DO** perform all feature development, bug fixes, and schema experiments on the `develop` branch first.
* **DO** run `cd frontend && npm run build` and `cd backend && npm run test:api` before committing.
* **DON'T** push directly to `main` until `develop` has been verified error-free by automated tests and manual QA.
* **DON'T** commit `backend/.env` or API keys to Git.

### 2. Database & Backend Rules
* **DO** keep SQL migrations idempotent (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS`) inside `backend/migrations/` AND append any new schema changes to `backend/schema.sql` so fresh installs via `node migrate.js` stay in sync.
* **DO** seed planned workout sets with `weight_kg = NULL` (unless the user explicitly configured a default weight in a template).
* **DON'T** seed initial planned sets with `weight_kg = 0`—a `0` value masks the frontend's previous-performance ghost placeholder and pre-fills `0` into inputs.
* **DO** format PostgreSQL dates in SQL using `to_char(... AT TIME ZONE 'UTC', 'YYYY-MM-DD')` when returning date strings for heatmaps or weekly buckets.
* **DON'T** return raw PostgreSQL `::date` casts to `pg-promise` for day-bucketed analytics—`pg-promise` converts `::date` into a local JS `Date` at midnight, which shifts by the server's timezone offset when `.toISOString()` is called.
* **DO** whitelist updatable columns in `workoutSetModel.updateSet` (`weight_kg`, `reps`, `completed`, `set_type`, `completed_at`).
* **DON'T** interpolate arbitrary `Object.keys(updates)` into SQL `UPDATE` statements.

### 3. Workout Lifecycle & State Machine Rules
* **DO** respect the strict workout status lifecycle:
  * `scheduled` → `POST /api/workouts/:id/start` → `active` (sets `started_at = NOW()`, enforced by unique partial index `uq_one_active_workout_per_user` so only **one** workout can be `active` per user at a time).
  * `active` → `POST /api/workouts/:id/finish` → `completed` (sets `ended_at = NOW()`).
  * `active` → `POST /api/workouts/:id/discard` → `scheduled` (resets `started_at = NULL`, clears completed flags on sets).
* **DON'T** allow `PUT /api/workouts/:id/sets/:setId` to mark sets completed when `workout.status !== 'active'`, or to edit weight/reps on a set where `completed = true` unless that request is un-ticking `completed: false`.
* **DON'T** use `PATCH /api/workouts/:id/status` to bypass `/start`, `/finish`, or `/discard`.

### 4. Authentication & Error Handling Rules
* **DO** return structured errors from backend controllers/services using `{ error: "Human-readable message", code: "MACHINE_CODE", field: "fieldName" }` so the frontend can attach inline errors to the exact input field.
* **DO** read `err.response?.data?.error` on the frontend (never `err.message`, which only says `"Request failed with status code 400"`).
* **DO** always query PostgreSQL in `GET /api/auth/me` (`userModel.findUserById(req.user.id)`) and attach the computed `onboarded` boolean.
* **DON'T** return `req.user` directly from `verifyToken` in `getMe`—the JWT payload only stores `{ id, iat, exp }`.

### 5. Frontend UI, Theme & State Rules
* **DO** use the semantic CSS-variable Tailwind tokens defined in `frontend/tailwind.config.js` and `frontend/src/index.css`:
  * Surfaces: `bg-bg`, `bg-surface`, `bg-raised`, `border-border`
  * Typography: `text-text`, `text-text-muted`, `font-display` (Fraunces headings), `font-sans` (DM Sans body)
  * Primary Accent: `bg-accent text-on-accent` (always use `text-on-accent` on `bg-accent` fills for WCAG contrast!)
  * AI Coach & Insights: `bg-ai-tint text-ai border-ai/50` (reserved strictly for AI Coach brief, AI overload chip, AI Smart Swap badge, and AI Routine Builder)
  * Statuses: `text-success`, `text-warning`, `text-danger` (always paired with a dot or icon + text label)
* **DON'T** use pure `#000000` or `#FFFFFF`, heavy neon drop-shadows, or browser-native `window.alert()` / `window.confirm()` (always use `ConfirmDialog` or `Modal`).
* **DO** persist in-progress user input (active workout drafts, onboarding wizard progress, template builder drafts) using `usePersistentState` (`localStorage`) so accidental browser refreshes never lose data.
* **DON'T** use Windows PowerShell `Set-Content` without `-Encoding utf8` on source files containing emojis or symbols (`×`, `—`, `🎉`, `🏋️`), as PowerShell 5 defaults to Windows-1252 and corrupts UTF-8 characters.
