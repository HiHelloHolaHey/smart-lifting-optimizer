# Smart Lifting Optimizer — File & Code Mapping Reference

This document maps every file, database table, API endpoint, backend service/model function, and frontend component/hook in the repository so developers can immediately locate where any feature is implemented.

---

## 1. Repository Directory Tree

```text
smart-lifting-optimizer/
├── README.md                                  # Setup guide, architecture overview & Do's/Don'ts
├── docs/
│   ├── CODE_FLOW.md                           # Detailed end-to-end request/response & state flows
│   ├── USER_WORKFLOW.md                       # Step-by-step user guide & QA walkthrough
│   ├── FILE_AND_CODE_MAPPING.md               # This file: complete file, symbol, API & DB map
│   ├── premium-color-theme-guide.md           # Active theme spec (Midnight Slate & Warm Porcelain)
│   └── original-color-theme-guide.md          # Archived original theme spec (Electric Indigo)
├── backend/
│   ├── package.json                           # Backend dependencies & scripts (dev, start, test:api)
│   ├── .env.example                           # Template environment variables
│   ├── schema.sql                             # Complete canonical PostgreSQL DDL schema
│   ├── seed.sql                               # 60+ seeded exercises across 9 muscle groups
│   ├── migrate.js                             # Applies schema.sql + seed.sql on a fresh database
│   ├── run-migration.js                       # Runs a specific SQL file in backend/migrations/
│   ├── apitest.js                             # 57-check automated E2E API test suite
│   ├── migrations/
│   │   ├── 002_phase2.sql                     # Adds set_type_enum, completed_at, workout_logs, workout_templates
│   │   └── 003_workout_lifecycle.sql          # Adds workouts.name, started_at, ended_at, uq_one_active_workout_per_user
│   └── src/
│       ├── index.js                           # Express app entrypoint, CORS, cookie-parser, route mounting
│       ├── config/
│       │   ├── index.js                       # Env config (port, jwtSecret, jwtExpiresIn, nodeEnv)
│       │   └── db.js                          # pg-promise singleton connection instance
│       ├── middleware/
│       │   ├── verifyToken.js                 # JWT verification middleware (cookie or Bearer header)
│       │   └── errorHandler.js                # Global JSON error formatter ({ error, code, field })
│       ├── models/
│       │   ├── userModel.js                   # CRUD for users table
│       │   ├── exerciseModel.js               # Queries for exercises catalog & muscle-group alternatives
│       │   ├── workoutModel.js                # CRUD for workouts table & set-joined queries
│       │   ├── workoutSetModel.js             # CRUD for workout_sets, session history & exercise swap
│       │   ├── workoutLogModel.js             # Upsert/fetch per-exercise notes (workout_logs)
│       │   ├── templateModel.js               # CRUD for custom splits (workout_templates)
│       │   ├── scheduleModel.js               # Upsert/fetch user availability (schedules)
│       │   └── onermModel.js                  # Upsert/fetch estimated 1RMs (one_rep_maxes)
│       ├── services/
│       │   ├── authService.js                 # Registration, login, profile validation & bcrypt/JWT logic
│       │   ├── onboardingService.js           # 1RM estimation, 4-week split seeding & onboarding orchestration
│       │   ├── schedulingService.js           # 7-day free-window slot finder across gym hours & busy blocks
│       │   ├── progressiveOverloadService.js  # 3-session overload math + optional Gemini AI refinement
│       │   ├── swapService.js                 # Deterministic exercise alternative scoring
│       │   └── llmService.js                  # Google Gemini REST client (8s timeout, JSON extraction)
│       ├── controllers/
│       │   ├── authController.js              # /api/auth handlers (register, login, logout, getMe, updateProfile)
│       │   ├── onboardingController.js        # /api/onboarding handler
│       │   ├── scheduleController.js          # /api/schedule/generate & /api/schedule/export (.ics)
│       │   ├── workoutController.js           # /api/workouts lifecycle, sets, notes, add/remove/swap exercises
│       │   ├── exerciseController.js          # /api/exercises catalog list & rule-based swap
│       │   ├── aiController.js                # /api/ai/* & /api/templates/* handlers
│       │   └── analyticsController.js         # /api/analytics/summary, /volume, /recovery, /profile-stats
│       └── routes/
│           ├── authRoutes.js
│           ├── onboardingRoutes.js
│           ├── scheduleRoutes.js
│           ├── workoutRoutes.js
│           ├── exerciseRoutes.js
│           ├── aiRoutes.js
│           ├── templateRoutes.js
│           └── analyticsRoutes.js
└── frontend/
    ├── package.json                           # Frontend dependencies & scripts (dev, build, preview)
    ├── vite.config.js                         # Vite config with /api proxy -> http://localhost:3001
    ├── tailwind.config.js                     # CSS-variable color token mappings & font families
    ├── postcss.config.js                      # Tailwind + Autoprefixer PostCSS setup
    ├── index.html                             # HTML shell loading Fraunces & DM Sans fonts
    └── src/
        ├── main.jsx                           # React root mounting BrowserRouter + App
        ├── App.jsx                            # Route definitions, ProtectedRoute, PublicRoute
        ├── index.css                          # Dark/Light CSS variables + base/component utility classes
        ├── api/
        │   ├── client.js                      # Axios instance (baseURL: '/api', withCredentials: true)
        │   └── endpoints.js                   # Typed API wrapper functions for all backend endpoints
        ├── context/
        │   ├── AuthContext.jsx                # User session state, login, register, logout, refreshUser, updateProfile
        │   └── WorkoutContext.jsx             # Shared workout list state & fetch helpers
        ├── hooks/
        │   ├── useCountdown.js                # 1-second live countdown hook for Next Session card
        │   ├── usePersistentState.js          # localStorage-synced useState hook (survives page refreshes)
        │   └── useProgressOverload.js         # Fetches progressive overload suggestion per exercise
        ├── utils/
        │   ├── labels.js                      # Split/goal/level labels, workoutName(), formatClock(), formatDuration()
        │   └── workoutSets.js                 # groupExercises(), findNextSet(), hasValue(), useNow()
        ├── components/
        │   ├── layout/
        │   │   └── AppLayout.jsx              # Persistent desktop sidebar + mobile bottom nav + theme toggle
        │   ├── ui/
        │   │   ├── Badge.jsx                  # Status pill with dot indicator (default, success, warning, danger, info, ai)
        │   │   ├── Button.jsx                 # Action button (primary, ghost, danger, loading spinner)
        │   │   ├── Card.jsx                   # Surface container (.glass-card)
        │   │   ├── ConfirmDialog.jsx          # Accessible alertdialog modal replacing window.confirm
        │   │   ├── LoadingSpinner.jsx         # Full-screen loading state
        │   │   ├── Modal.jsx                  # Accessible dialog overlay (Escape/backdrop close)
        │   │   └── TimeInput.jsx              # Non-looping 24h numeric + 2-column popover time selector
        │   ├── dashboard/
        │   │   ├── MonthlyVolumeChart.jsx     # Recharts BarChart for 30-day weekly volume
        │   │   └── MuscleBodyMap.jsx          # Interactive Front/Back SVG muscle recovery heatmap
        │   └── workout/
        │       ├── SetRow.jsx                 # Individual set row (W/number, previous, kg, reps, lockable checkbox)
        │       ├── RestTimer.jsx              # Auto-triggered countdown bar beneath completed set
        │       ├── ExerciseNotes.jsx          # Collapsible debounced auto-save notes textarea
        │       ├── SwapModal.jsx              # 2-tab modal: AI Smart Swap + Manual Catalog Swap
        │       └── ExercisePicker.jsx         # Searchable, muscle-filtered exercise selector
        └── pages/
            ├── LoginPage.jsx                  # Sign-in page with field-level error attachment
            ├── RegisterPage.jsx               # Registration page with live password requirement checklist
            ├── OnboardingPage.jsx             # 4-step wizard + completion screen
            ├── DashboardPage.jsx              # Command Center (Next Session / In-Progress HUD, stats, charts, body map)
            ├── WorkoutsPage.jsx               # Upcoming & active workouts grouped by week
            ├── WorkoutPage.jsx                # Live Training HUD & session lifecycle controller
            ├── TemplatesPage.jsx              # Custom split builder (FLIP drag/arrow reorder) + AI routine generator
            └── ProfilePage.jsx                # User details, Edit Profile modal, lifetime stats & collapsible history
```

---

## 2. Database Schema Mapping (`backend/schema.sql`)

| Table | Primary Key | Key Columns & Constraints | Used By Models / Controllers |
|---|---|---|---|
| `users` | `id UUID` | `email UNIQUE`, `password_hash`, `first_name`, `height_cm`, `weight_kg`, `experience_level` (`beginner`\|`intermediate`\|`advanced`), `goal` (`strength`\|`hypertrophy`\|`weight_loss`\|`endurance`) | `userModel.js`, `authService.js`, `onboardingService.js` |
| `exercises` | `id SERIAL` | `name UNIQUE`, `muscle_group`, `equipment_needed JSONB`, `is_compound BOOLEAN` | `exerciseModel.js`, `swapService.js`, `aiController.js` |
| `workouts` | `id UUID` | `user_id FK`, `scheduled_date`, `split_type`, `status` (`scheduled`\|`active`\|`completed`\|`skipped`), `name`, `started_at`, `ended_at`. Partial unique index: `uq_one_active_workout_per_user` (`WHERE status = 'active'`) | `workoutModel.js`, `workoutController.js`, `analyticsController.js` |
| `workout_sets` | `id UUID` | `workout_id FK`, `exercise_id FK`, `weight_kg DECIMAL`, `reps INT`, `set_number INT`, `set_type` (`warmup`\|`working`), `completed BOOLEAN`, `completed_at TIMESTAMPTZ` | `workoutSetModel.js`, `workoutController.js`, `analyticsController.js` |
| `workout_logs` | `id UUID` | `workout_id FK`, `exercise_id FK`, `exercise_notes TEXT`, `UNIQUE (workout_id, exercise_id)` | `workoutLogModel.js`, `workoutController.js` |
| `workout_templates` | `id UUID` | `user_id FK`, `name TEXT`, `exercise_order_json JSONB` (`[{ exercise_id, name, muscle_group, sets, rep_min, rep_max, weight_kg }]`) | `templateModel.js`, `aiController.js` |
| `schedules` | `id UUID` | `user_id UNIQUE FK`, `gym_open_time TIME`, `gym_close_time TIME`, `busy_times_json JSONB`, `preferred_frequency INT`, `goal_priority` (`morning`\|`evening`) | `scheduleModel.js`, `scheduleController.js` |
| `one_rep_maxes` | `id UUID` | `user_id FK`, `exercise_id FK`, `estimated_1rm_kg DECIMAL`, `UNIQUE (user_id, exercise_id)` | `onermModel.js`, `onboardingService.js`, `progressiveOverloadService.js` |

---

## 3. Complete API Endpoint → Backend → Frontend Mapping

### 3.1 Authentication (`/api/auth`)
| HTTP | Endpoint | Route File | Controller Function | Service / Model Functions | Frontend Caller (`endpoints.js`) |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | `authRoutes.js` | `authController.register` | `authService.register` → `userModel.createUser` | `auth.register` (`RegisterPage.jsx`) |
| `POST` | `/api/auth/login` | `authRoutes.js` | `authController.login` | `authService.login` → `userModel.findUserByEmail` | `auth.login` (`LoginPage.jsx`) |
| `POST` | `/api/auth/logout` | `authRoutes.js` | `authController.logout` | Clears `token` cookie | `auth.logout` (`AppLayout.jsx`) |
| `GET` | `/api/auth/me` | `authRoutes.js` | `authController.getMe` | `userModel.findUserById` + `authService.withOnboarded` | `auth.getMe` (`AuthContext.jsx`) |
| `PUT` | `/api/auth/profile` | `authRoutes.js` | `authController.updateProfile` | `authService.updateProfile` → `userModel.updateUser` | `auth.updateProfile` (`ProfilePage.jsx`) |

### 3.2 Onboarding & Scheduling (`/api/onboarding`, `/api/schedule`)
| HTTP | Endpoint | Route File | Controller Function | Service / Model Functions | Frontend Caller (`endpoints.js`) |
|---|---|---|---|---|---|
| `POST` | `/api/onboarding` | `onboardingRoutes.js` | `onboardingController.onboard` | `onboardingService.initializeOnboarding` → `calculate1RM`, `generateWeeklyTemplate`, `scheduleModel.upsertSchedule` | `onboarding.onboard` (`OnboardingPage.jsx`) |
| `POST` | `/api/schedule/generate` | `scheduleRoutes.js` | `scheduleController.generateSchedule` | `schedulingService.findAvailableSlots` + updates upcoming workout `scheduled_date`s | `schedule.generate` (`OnboardingPage.jsx`) |
| `GET` | `/api/schedule/export` | `scheduleRoutes.js` | `scheduleController.exportICS` | Queries scheduled `workouts` → formats RFC 5545 `.ics` calendar download | `<a href="/api/schedule/export" download>` (`DashboardPage.jsx`) |

### 3.3 Workouts & In-Workout Logger (`/api/workouts`)
| HTTP | Endpoint | Route File | Controller Function | Service / Model Functions | Frontend Caller (`endpoints.js`) |
|---|---|---|---|---|---|
| `GET` | `/api/workouts` | `workoutRoutes.js` | `workoutController.getWorkouts` | `workoutModel.findWorkoutsByUser` (includes `total_sets`, `completed_sets`, `volume`) | `workouts.getAll` (`WorkoutContext.jsx`) |
| `GET` | `/api/workouts/:id` | `workoutRoutes.js` | `workoutController.getWorkout` | `workoutModel.findWorkoutById`, `workoutLogModel.findByWorkout`, `workoutSetModel.getPreviousSessionSets` | `workouts.getById` (`WorkoutPage.jsx`, `DashboardPage.jsx`) |
| `POST` | `/api/workouts/:id/start` | `workoutRoutes.js` | `workoutController.startWorkout` | Checks active workout conflict (`409`) → sets `status = 'active', started_at = NOW()` | `workouts.start` (`WorkoutPage.jsx`) |
| `POST` | `/api/workouts/:id/finish` | `workoutRoutes.js` | `workoutController.finishWorkout` | Sets `status = 'completed', ended_at = NOW()` | `workouts.finish` (`WorkoutPage.jsx`, `DashboardPage.jsx`) |
| `POST` | `/api/workouts/:id/discard` | `workoutRoutes.js` | `workoutController.discardWorkout` | Resets `workout_sets` (`completed = false`) and `workouts` (`status = 'scheduled', started_at = NULL`) | `workouts.discard` (`WorkoutPage.jsx`) |
| `PUT` | `/api/workouts/:id/sets/:setId` | `workoutRoutes.js` | `workoutController.updateSet` | Enforces `active` status & set lock (`409 SET_LOCKED`) → `workoutSetModel.updateSet` | `workouts.updateSet` (`WorkoutPage.jsx`) |
| `POST` | `/api/workouts/:id/sets` | `workoutRoutes.js` | `workoutController.addSet` | `workoutSetModel.nextSetNumber` → `workoutSetModel.createSet` | `workouts.addSet` (`WorkoutPage.jsx`) |
| `POST` | `/api/workouts/:id/exercises` | `workoutRoutes.js` | `workoutController.addExerciseToWorkout` | Validates exercise not already in workout → inserts N working sets | `workouts.addExercise` (`WorkoutPage.jsx`) |
| `DELETE` | `/api/workouts/:id/exercises/:exerciseId` | `workoutRoutes.js` | `workoutController.removeExerciseFromWorkout` | Deletes sets & logs for that exercise in the workout | `workouts.removeExercise` (`WorkoutPage.jsx`) |
| `POST` | `/api/workouts/:id/swap-exercise` | `workoutRoutes.js` | `workoutController.swapExerciseInWorkout` | `workoutSetModel.swapExerciseInWorkout` (replaces uncompleted sets) | `workouts.swapExercise` (`WorkoutPage.jsx`) |
| `PUT` | `/api/workouts/:id/logs/:exerciseId` | `workoutRoutes.js` | `workoutController.upsertExerciseNotes` | `workoutLogModel.upsertNote` | `workouts.saveNotes` (`WorkoutPage.jsx`) |
| `GET` | `/api/workouts/next/:exerciseId` | `workoutRoutes.js` | `workoutController.getNextForExercise` | `progressiveOverloadService.calculateNextSession` | `workouts.getNextForExercise` (`useProgressOverload.js`) |

### 3.4 Exercises, AI & Templates (`/api/exercises`, `/api/ai`, `/api/templates`)
| HTTP | Endpoint | Route File | Controller Function | Service / Model Functions | Frontend Caller (`endpoints.js`) |
|---|---|---|---|---|---|
| `GET` | `/api/exercises` | `exerciseRoutes.js` | `exerciseController.listExercises` | `exerciseModel.findAll` | `exerciseCatalog.list` (`WorkoutPage.jsx`, `TemplatesPage.jsx`) |
| `POST` | `/api/exercises/swap` | `exerciseRoutes.js` | `exerciseController.swapExercise` | `swapService.findAlternatives` | `exercises.swap` |
| `POST` | `/api/ai/pre-workout-brief` | `aiRoutes.js` | `aiController.preWorkoutBrief` | `workoutSetModel.getLastNSessionsForExercise` + `llmService.generateText` (with rule fallback) | `ai.preWorkoutBrief` (`WorkoutPage.jsx`) |
| `POST` | `/api/ai/smart-swap` | `aiRoutes.js` | `aiController.smartSwap` | `exerciseModel.findByMuscleGroup` + `llmService.generateJSON` / `swapService.findAlternatives` | `ai.smartSwap` (`SwapModal.jsx`) |
| `POST` | `/api/ai/generate-routine` | `aiRoutes.js` | `aiController.generateRoutine` | `exerciseModel.findAll` + `llmService.generateJSON` / keyword fallback | `ai.generateRoutine` (`TemplatesPage.jsx`) |
| `GET` | `/api/templates` | `templateRoutes.js` | `aiController.listTemplates` | `templateModel.findByUser` | `templates.list` (`TemplatesPage.jsx`) |
| `POST` | `/api/templates` | `templateRoutes.js` | `aiController.createTemplate` | `validateExercises` → `templateModel.create` | `templates.create` (`TemplatesPage.jsx`) |
| `PUT` | `/api/templates/:id` | `templateRoutes.js` | `aiController.updateTemplate` | `validateExercises` → `templateModel.update` | `templates.update` (`TemplatesPage.jsx`) |
| `DELETE` | `/api/templates/:id` | `templateRoutes.js` | `aiController.deleteTemplate` | `templateModel.remove` | `templates.remove` (`TemplatesPage.jsx`) |
| `POST` | `/api/templates/:id/start` | `templateRoutes.js` | `aiController.startFromTemplate` | Creates workout with template `name` + seeds sets with template `weight_kg` | `templates.start` (`TemplatesPage.jsx`) |

### 3.5 Analytics (`/api/analytics`)
| HTTP | Endpoint | Route File | Controller Function | Purpose | Frontend Caller (`endpoints.js`) |
|---|---|---|---|---|---|
| `GET` | `/api/analytics/summary` | `analyticsRoutes.js` | `analyticsController.getDashboardSummary` | Current week stats (`planned`, `completed`, `sets`, `volume`), 8-week volume trend, 7-day Mon–Sun heatmap | `analytics.summary` (`DashboardPage.jsx`) |
| `GET` | `/api/analytics/volume` | `analyticsRoutes.js` | `analyticsController.getMonthlyVolume` | 30-day weekly volume bars (`week`, `volume`, `sets`) | `analytics.volume` (`DashboardPage.jsx`) |
| `GET` | `/api/analytics/recovery` | `analyticsRoutes.js` | `analyticsController.getMuscleRecovery` | Rolling 7-day exponential decay fatigue (`0..100`) per muscle group | `analytics.recovery` (`DashboardPage.jsx`) |
| `GET` | `/api/analytics/profile-stats` | `analyticsRoutes.js` | `analyticsController.getProfileStats` | Lifetime totals, avg duration, week streak, top 3 lifts, most trained muscle | `analytics.profileStats` (`ProfilePage.jsx`) |

---

## 4. Frontend Shared Utilities & Hooks Reference

| File | Exported Symbol | Description |
|---|---|---|
| `src/utils/cn.js` | `cn(...inputs)` | Standard `shadcn/ui` class name merger (`clsx` + `tailwind-merge`) |
| `src/components/ui/Button.jsx` | `Button`, `buttonVariants` | `shadcn/ui` Button built with `class-variance-authority` and `@radix-ui/react-slot` |
| `src/components/ui/Badge.jsx` | `Badge`, `badgeVariants` | `shadcn/ui` Badge with automatic status dot indicator |
| `src/components/ui/Card.jsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `shadcn/ui` Card family styled with `--surface` and `--border` |
| `src/components/ui/Input.jsx` | `Input` | `shadcn/ui` Input primitive with error state support |
| `src/components/ui/Label.jsx` | `Label` | `shadcn/ui` Label primitive |
| `src/components/ui/Modal.jsx` | `Modal` | `shadcn/ui` Dialog built on `@radix-ui/react-dialog` |
| `src/components/ui/ConfirmDialog.jsx` | `ConfirmDialog` | `shadcn/ui` AlertDialog built on `@radix-ui/react-alert-dialog` |
| `src/components/ui/Tabs.jsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `shadcn/ui` Tabs built on `@radix-ui/react-tabs` |
| `src/components/ui/Tooltip.jsx` | `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` | `shadcn/ui` Tooltip built on `@radix-ui/react-tooltip` |
| `src/components/ui/Progress.jsx` | `Progress` | `shadcn/ui` Progress bar built on `@radix-ui/react-progress` |
| `src/components/ui/TimeInput.jsx` | `TimeInput` | `shadcn/ui` Popover-backed (`@radix-ui/react-popover`) 24h time selector |
| `src/utils/labels.js` | `SPLIT_NAMES`, `GOAL_LABELS`, `LEVEL_LABELS` | Human-readable display maps for split codes (`PPL_PUSH` → `"Push Day"`), goals, and experience levels |
| `src/utils/labels.js` | `workoutName(workout)` | Returns `workout.name` (if created from a custom template) or `SPLIT_NAMES[workout.split_type]` |
| `src/utils/labels.js` | `formatClock(seconds)` | Formats elapsed/rest seconds as `MM:SS` or `H:MM:SS` |
| `src/utils/labels.js` | `formatDuration(startedAt, endedAt)` | Returns human-readable duration (e.g. `"42 min"`) between two ISO timestamps |
| `src/utils/workoutSets.js` | `groupExercises(sets)` | Groups flat `workout_sets` rows by `exercise_id` into `[{ exercise_id, exercise_name, muscle_group, sets: [...] }]` |
| `src/utils/workoutSets.js` | `findNextSet(sets)` | Finds the first incomplete set across grouped exercises for the Dashboard `InProgressCard` |
| `src/utils/workoutSets.js` | `hasValue(v)` | Returns `true` only when `v != null && v !== '' && Number(v) > 0` (prevents `0` from masking ghost text) |
| `src/utils/workoutSets.js` | `useNow(intervalMs)` | Returns a reactive `Date.now()` timestamp ticking every `intervalMs` for live timers |
| `src/hooks/usePersistentState.js` | `usePersistentState(key, initial)` | Drop-in `useState` replacement backed by `localStorage`; returns `[state, setState, clear]` |
| `src/hooks/useCountdown.js` | `useCountdown(targetDate)` | Returns `{ days, hours, minutes, seconds, isPast }` for the Dashboard Next Session timer |
| `src/hooks/useProgressOverload.js` | `useProgressOverload(exerciseId)` | Fetches `/api/workouts/next/:exerciseId` on mount and returns `{ suggestion, loading, error }` |
