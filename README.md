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
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 (CSS-variable token system), Recharts, Lucide React, React Router v6 |
| **Backend** | Node.js (v18+), Express 4, `pg-promise`, `bcryptjs`, `jsonwebtoken`, `cookie-parser` |
| **Database** | PostgreSQL (Neon Serverless or local PostgreSQL 14+) |
| **AI Integration** | Google Gemini API (`gemini-2.0-flash` by default via REST) with deterministic rule-based fallbacks |
| **Typography & Theme** | `Fraunces` (headings) + `DM Sans` (body/tabular data) · Midnight Slate (`#15181D`) & Warm Porcelain (`#F4F2EE`) |

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
