# Smart Lifting Optimizer 🏋️

A full-stack AI-powered fitness application that automates workout scheduling, tracks progressive overload, and provides real-time exercise alternatives.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Recharts, Lucide React |
| **Backend** | Node.js, Express.js, pg-promise |
| **Database** | PostgreSQL (Neon serverless) |
| **Auth** | JWT via httpOnly cookies |
| **Design** | Dark Mode · Electric Indigo (`#6366F1`) · Glassmorphism |

## Features

- 🗓️ **Intelligent Scheduling Engine** — Gap-finding algorithm across gym hours and user busy times, with morning/evening priority
- 📈 **Progressive Overload Algorithm** — Analyzes last 3 sessions, auto-increments weight by 2.5% or reps by 1
- 🔄 **Smart Swap** — Real-time exercise alternatives by muscle group and equipment type
- 🧙 **Onboarding Wizard** — 4-step setup capturing stats, goals, split preference, and availability
- 📊 **Command Center Dashboard** — Live countdown timer, weekly heatmap, volume progress chart
- 💪 **Training HUD** — Real-time set logging with overload suggestions and swap modal

## Project Structure

```
workout-app/
├── backend/          # Express API
│   ├── schema.sql    # PostgreSQL DDL
│   ├── seed.sql      # 60+ exercises
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── services/
│       ├── controllers/
│       └── routes/
└── frontend/         # React/Vite SPA
    └── src/
        ├── api/
        ├── components/ui/
        ├── context/
        ├── hooks/
        └── pages/
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET in .env

npm install
node migrate.js   # Apply schema + seed data
npm run dev       # Starts on :3001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts on :5173
```

### Environment Variables (backend/.env)

```
PORT=3001
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/onboarding` | Initialize 1RM + 4-week template |
| `POST` | `/api/schedule/generate` | Generate 7-day schedule |
| `GET` | `/api/workouts` | List all workouts |
| `GET` | `/api/workouts/:id` | Single workout + sets |
| `PUT` | `/api/workouts/:id/sets/:setId` | Log a set |
| `GET` | `/api/workouts/next/:exerciseId` | Progressive overload suggestion |
| `POST` | `/api/exercises/swap` | Smart exercise alternatives |

## License

MIT

## Phase 2 features

- **In-workout logger**: warm-up/working sets, previous-performance ghost text, one-tap completion, auto rest timer, per-exercise notes. In-progress input is persisted to localStorage and survives refreshes.
- **Template builder** (/templates): drag-and-drop custom splits with rep ranges; generate one from natural language with AI.
- **Dashboard**: monthly volume chart and an SVG muscle-recovery body map (rolling 7 days).
- **AI endpoints** (Gemini): POST /api/ai/pre-workout-brief, /api/ai/smart-swap, /api/ai/generate-routine. Set LLM_API_KEY in backend/.env. Without a key, or on timeout/error, every endpoint falls back to deterministic logic.
- **Calendar export**: GET /api/schedule/export returns an .ics file.
- **Migration**: `node backend/run-migration.js backend/migrations/002_phase2.sql` (idempotent).
- **Tests**: with the backend running, `node backend/phase2test.js`.

