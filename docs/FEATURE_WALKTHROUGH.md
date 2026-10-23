# Smart Lifting Optimizer — Feature Walkthrough (Updated for Phase 2.1)

A step-by-step checklist to test every feature and improvement. Tick each box as you go.

**Before you start**

1. Backend: `cd backend && npm run dev` → http://localhost:3001/api/health should return `{"status":"ok"}`
2. Frontend: `cd frontend && npm run dev` → open http://localhost:5173
3. Branch: `develop`

**Test account:** `smoketest@smartlift.dev` / `SmokeTest1!`
Use a brand-new account in Part 1 to test registration and onboarding from a clean slate.

> **Legend:** ✅ Expected result · 💡 Tip

---

## Part 1 — Accounts & Onboarding

### 1.1 Register (`/register`)
- [ ] Go to `/register` → only **Email**, **Password**, and **Confirm Password** are asked (First Name is now asked in Onboarding Step 1)
- [ ] Type a password → ✅ live password requirement checklist (`8+ chars`, `1+ letter`, `1+ number`) lights up green as you type
- [ ] Submit → ✅ redirected to `/onboarding`
- [ ] Try registering the same email again → ✅ inline error under email with a "Sign in instead" link
- [ ] Try signing in on `/login` with an unknown email vs. wrong password → ✅ distinct field-specific error messages (`No account found for…` vs. `Incorrect password…`)

### 1.2 Onboarding wizard (4 steps)
- [ ] **Step 1 (About you):** First name (required), height (cm), weight (kg), experience level (Beginner / Intermediate / Advanced)
- [ ] **Step 2 (Training Goal):** pick a goal (Strength / Hypertrophy / Weight Loss / Endurance)
- [ ] **Step 3 (Workout Split):** pick a split (PPL / Upper-Lower / Full Body)
- [ ] **Step 4 (Availability):**
  - [ ] Question: *"Do you train at the same gym every day?"* with an info box explaining why gym hours are used
  - [ ] Pick **Yes, same gym** → shows **Gym opens / Gym closes** using the custom **TimeInput** (type digits directly or click the clock/chevron button to pick from a non-looping `00–23` / `00–59` list)
  - [ ] Or pick **No, I train at different places** → gym hours are skipped
  - [ ] Weekly frequency slider supports **1 to 7 days**
- [ ] Click **Finish Setup**
- ✅ Shows a completion screen (`You're all set, {FirstName}!`) with buttons to **View my workouts** (`/workouts`) or **Go to dashboard** (`/dashboard`)

### 1.3 Login / Logout / Session & Route Guards
- [ ] Sidebar shows your real first name and email immediately after login/onboarding (never `user@example.com`)
- [ ] While logged in, manually visit `/login` or `/register` (or press browser Back) → ✅ automatically bounced back to `/dashboard`
- [ ] Refresh any page → ✅ you stay logged in

---

## Part 2 — Dashboard ("Command Center") & Persistent Sidebar

- [ ] **Sidebar:** stays in the exact same position across **Dashboard**, **Workouts**, **Templates**, and **Profile**
- [ ] **New account zero-state:** on a brand-new account with 0 completed workouts, **Weekly Stats**, **Volume Progress**, and **Weekly Heatmap** all start at `0` (no fake placeholder numbers)
- [ ] **Next Session card:** shows the next workout with human-readable name (e.g. `Push (Chest, Shoulders, Triceps)` or custom template name) and a live countdown
- [ ] **Muscle Recovery body map:** all body regions (including head, hands, feet, calves, forearms) render in recovered green (`100%`) when untrained

---

## Part 3 — In-Workout Logger & Workout Lifecycle

Open a scheduled workout from **Preview / Start Workout** on the Dashboard or from `/workouts`.

### 3.1 Planning mode vs. Active mode ("Start Now")
- [ ] When you first open a scheduled workout, a banner at the top shows **"Previewing workout — press Start Now to begin tracking time and logging sets"**
- [ ] Set checkboxes show a 🔒 lock icon until you press **Start Now**
- [ ] Click **Start Now** → ✅ status changes to `In progress`, the live elapsed timer (`00:00`) starts ticking in the header, and set checkboxes unlock

### 3.2 Navigating away while a workout is active
- [ ] Click the **←** Back arrow in the workout header while a workout is active → ✅ custom in-app popup offers:
  - **Keep active & go to Dashboard** (workout stays running!)
  - **Pause & reset to Scheduled** (discards completed sets)
  - **Stay in workout**
- [ ] Choose **Keep active & go to Dashboard** → ✅ Dashboard top card turns into an **In Progress** live HUD showing elapsed timer, progress bar, next set preview, active rest timer, **Continue Workout**, and **Finish Workout** buttons

### 3.3 Set rows & input ergonomics
Each row: **Set # (or W)** · **Previous** · **kg** · **Reps** · **✓**
- [ ] New workouts have empty inputs (no `0` pre-filled), so ghost placeholders (`80`, `8`) are clearly visible
- [ ] If you have previous history for an exercise, the input is pre-filled with your last session's weight/reps and the **Previous** column shows `80 kg × 8`
- [ ] Click into any weight or reps input → ✅ existing text is **auto-selected** so typing immediately replaces it
- [ ] Tap **✓** to complete a set → ✅ row turns green and **weight/reps inputs lock** so you can't accidentally edit a completed set
- [ ] Tap **✓** again to un-tick → ✅ inputs unlock for editing

### 3.4 Rest timer
- [ ] Complete a working set → ✅ a bar appears **under that set** counting down from **2:00** (or **1:00** for warm-up sets)
- [ ] **+** / **−** adjusts by 15 s; **⏭** skips it

### 3.5 Add / Remove / Swap Exercises
- [ ] **⇄ Swap button** on an exercise opens a modal with two tabs:
  - **AI Smart Swap:** enter a reason (e.g. `lower back pain` or `equipment busy`) to get 2 biomechanically matched alternatives
  - **Manual Swap:** search and filter the full exercise catalog by muscle group
- [ ] Pick an alternative → ✅ the exercise replaces the old one in-place immediately
- [ ] **Trash icon** next to an exercise removes it from the workout (via custom confirmation modal)
- [ ] **+ Add Exercise to Workout** button at the bottom of the exercise list lets you add any exercise from the catalog with custom set count

### 3.6 Exercise notes (auto-save)
- [ ] Click **Notes** under an exercise → type a form cue
- ✅ Auto-saves after ~600ms of inactivity (shows `Saving…` → `Saved` indicator, plus a green dot when collapsed)

### 3.7 Complete the workout
- [ ] Click **Finish** → ✅ if there are unfinished sets, a custom confirmation dialog asks whether to complete anyway; then shows the 🎉 summary screen

---

## Part 4 — Workouts List & Profile

### 4.1 Upcoming Workouts (`/workouts`)
- [ ] Only shows **In Progress** and **Scheduled** workouts (grouped by week), keeping the list clean
- [ ] Includes a link at the bottom to view completed workouts on your Profile

### 4.2 Profile, Edit Stats & Completed History (`/profile`)
- [ ] Shows your profile details + **Edit Profile** button (update first name, height, weight, experience level, training goal)
- [ ] Shows **Lifetime Training Stats** (Completed Workouts, Total Volume, Sets Logged, Current Streak, Best Streak, Active Days, Top Lifts by Est. 1RM)
- [ ] **Completed Workouts** collapsible section at the bottom lists all finished sessions with date, duration, set count, and volume

---

## Part 5 — Template Builder (`/templates`)

- [ ] Renders inside the unified sidebar layout
- [ ] Add exercises from the left catalog
- [ ] Each exercise row has aligned **Sets**, **Kg (opt)** (optional default weight), and **Reps (min–max)** inputs
- [ ] Reorder exercises with **▲ / ▼** or drag-and-drop → ✅ rows animate smoothly into their new position (FLIP transition)
- [ ] Delete a saved template → ✅ uses the custom dark-mode `ConfirmDialog` (no browser `window.confirm`)
- [ ] **Start workout** from a template → ✅ workout inherits the template's custom name and any default weights you configured

---

## Part 6 — Automated API Check

With the backend running (`cd backend && npm run dev`):

```bash
cd backend
npm run test:api
```
✅ Expected: runs `apitest.js` (50+ checks covering auth error codes, onboarding, profile editing, workout lifecycle, set locking, exercise add/remove/swap, templates with default weight, analytics summary/profile-stats, AI endpoints, and calendar export) and ends with `ALL PASSED`.
