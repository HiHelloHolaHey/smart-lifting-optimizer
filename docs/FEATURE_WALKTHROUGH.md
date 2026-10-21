# Smart Lifting Optimizer — Feature Walkthrough

A step-by-step checklist to try every feature. Tick each box as you go.

**Before you start**

1. Backend: `cd backend && npm run dev` → http://localhost:3001/api/health should return `{"status":"ok"}`
2. Frontend: `cd frontend && npm run dev` → open http://localhost:5173
3. Branch: `develop` (Phase 2 features are not on `main` yet)

**Test account (already has 32 workouts):** `smoketest@smartlift.dev` / `SmokeTest1!`
Use a brand-new account in Part 1 to see onboarding.

> **Legend:** ✅ Expected result · 💡 Tip

---

## Part 1 — Accounts & Onboarding

### 1.1 Register
- [ ] Go to `/register` → enter first name, email, password → **Create account**
- ✅ You are redirected to `/onboarding`
- [ ] Try registering the same email again → ✅ an error message appears

### 1.2 Onboarding wizard (4 steps)
- [ ] **Step 1:** first name, height, weight, experience level (Beginner / Intermediate / Advanced)
- [ ] **Step 2:** pick a goal (Strength / Hypertrophy / Weight Loss / Endurance)
- [ ] **Step 3:** pick a split (PPL / Upper-Lower / Full Body)
- [ ] **Step 4:** gym open/close time, Morning or Evening, weekly frequency, busy times
- [ ] Click **Finish Setup**
- ✅ Success animation, then redirect to `/dashboard`
- ✅ A 4-week program is created (check `/workouts`)

### 1.3 Login / Logout / Session
- [ ] Log out (sidebar) → log in again
- [ ] Refresh the page → ✅ you stay logged in
- [ ] Open `/dashboard` while logged out → ✅ redirected to `/login`

---

## Part 2 — Dashboard ("Command Center")

- [ ] **Next Session card:** shows the next workout and a live countdown (days/hrs/min/sec)
- [ ] Click **Start Workout** → opens the workout page
- [ ] **Sidebar:** Dashboard, Workouts, Templates, Profile links all work
- [ ] **Monthly Volume** chart (bottom-left) — hover a bar for exact volume
  - 💡 Shows "Log a workout…" until you complete working sets (Part 3)
- [ ] **Muscle Recovery** body map (bottom-right) — see Part 5
- [ ] **Sync to Calendar** button — see Part 6

> **Known limitation:** *Weekly Stats*, *Volume Progress* and the *Weekly Heatmap* still show placeholder data. Only Monthly Volume and Muscle Recovery use real data.

---

## Part 3 — In-Workout Logger

Open a workout from **Start Workout** or from `/workouts`.

### 3.1 AI coach brief
- [ ] A card at the top shows a 2-sentence tip
- ✅ Label says **"AI Coach"** if `LLM_API_KEY` is set, otherwise **"Coach"** (rule-based fallback)

### 3.2 Overload suggestion chip
- [ ] Under each exercise name: `Suggested: 60kg × 8`
- [ ] Hover it → tooltip explains the reason. A ✦ icon means AI-adjusted

### 3.3 Set rows
Each row: **Set # (or W)** · **Previous** · **kg** · **Reps** · **✓**
- [ ] Type a weight and reps
- [ ] Tap **✓** → row turns green
- [ ] Tap **✓** again → un-completes it
- [ ] Leave inputs empty and tap ✓ → ✅ it logs the previous/target values ("same as last time")
- 💡 **Previous** shows `—` the first time. Complete a set, finish the workout, then open another workout with the same exercise to see ghost text like `60 kg x 8`.

### 3.4 Rest timer
- [ ] Complete a working set → ✅ a bar appears **under that set** counting down from **2:00**
- [ ] **+** / **−** change it by 15 s; **⏭** skips it
- [ ] Complete a warm-up set → ✅ 1:00 timer
- [ ] At 0:00 it shows **Go!** and disappears

### 3.5 Warm-up and extra sets
- [ ] **+ Set** adds a working set; **🔥 Warm-up** adds a **W** row (amber)
- ✅ Warm-ups are listed first and don't count toward volume

### 3.6 Exercise notes
- [ ] Click **Notes** under an exercise → type e.g. "Left knee feels better"
- [ ] Click outside the box → ✅ saved (a • appears next to "Notes" when collapsed)
- [ ] Reload the page → ✅ the note is still there

### 3.7 Refresh safety (important)
- [ ] Type weight/reps in several rows **without** ticking them
- [ ] Start a rest timer, then **refresh the browser**
- ✅ Typed numbers and the running timer are restored

### 3.8 Smart Swap
- [ ] Click **⇄** on an exercise → modal opens
- [ ] Enter a reason (e.g. `lower back pain`) → **Find**
- ✅ Two alternatives appear with a rationale and equipment tags
- ✅ Footer says "Picked by AI coach" (with key) or "Rule-based picks" (without)
- [ ] Click one → ✅ the exercise is replaced in the workout (completed sets stay unchanged)

### 3.9 Complete the workout
- [ ] Click **Complete Workout** → 🎉 screen shows total sets and volume → back to the dashboard
- ✅ Status badge changed: `scheduled` → `active` (after the first set) → `completed`

---

## Part 4 — Workouts List & Profile

- [ ] `/workouts`: workouts grouped by week with status badges
- [ ] Click a workout → opens the logger
- [ ] `/profile`: your stats, goal and experience level

---

## Part 5 — Muscle Recovery & Analytics

After completing a few **working** sets (Part 3), return to the dashboard.

- [ ] **Body map** (front + back): trained muscles shift from green → amber → red
- [ ] Hover or focus a muscle → text below shows `Chest · Moderate · 6 sets / 7d`
- ✅ Fatigue ≈ working sets in the last 7 days ÷ 10, fading over ~4 days
- ✅ Untrained muscles stay green ("Recovered")
- [ ] **Monthly Volume** bars now show your weekly total (kg) with 30-day totals above

---

## Part 6 — Calendar Export

- [ ] Click **Sync to Calendar** → `workouts.ics` downloads
- [ ] Import it into Google Calendar (Settings → Import) or double-click it for Apple/Outlook
- ✅ Upcoming workouts appear as 1-hour events with a 30-minute reminder

---

## Part 7 — Template Builder (`/templates`)

### 7.1 Build manually
- [ ] Type a split name (e.g. `Push Day`)
- [ ] Search/filter exercises on the left (by muscle group) and click to add
- [ ] Change **Sets** and **Reps** (min–max) for each
- [ ] **Drag** the ⠿ handle to reorder (a purple outline shows the drop spot)
- [ ] Use **▲ ▼** to reorder, **✕** to remove
- [ ] Click **Save Template** → ✅ it appears under *Your Templates*

### 7.2 Generate with AI
- [ ] Type `I only have dumbbells and 45 minutes` → **Generate with AI**
- ✅ The builder fills with a routine using only exercises from your database
- ✅ Message says whether AI or the basic fallback built it
- [ ] Tweak it and save

### 7.3 Use templates
- [ ] **Edit** (✏️): loads it back into the builder → **Update Template**
- [ ] **Start workout**: creates a workout from it and opens the logger
- [ ] **Delete** (🗑): asks for confirmation
- [ ] Refresh mid-edit → ✅ the unsaved builder contents are restored

---

## Part 8 — AI Mode (needs an API key)

1. Add to `backend/.env`: `LLM_API_KEY=your_gemini_key`
2. Restart the backend (nodemon does it automatically on save)
3. Repeat **3.1**, **3.2**, **3.8** and **7.2**
- ✅ Labels now read "AI Coach", "Picked by AI coach", "AI built a routine"
- [ ] **Fallback test:** put an invalid key → everything still works with the rule-based labels, no errors shown

---

## Part 9 — Automated API Check

With the backend running:

```bash
cd backend
node phase2test.js
```
✅ Expected: every line says `PASS`, ending with `ALL PASSED` (28 checks). This covers sets, notes, swap, AI endpoints, templates, analytics, calendar export, validation and auth.

---

## Feature → Where to find it

| Feature | Location |
|---|---|
| Registration / login | `/register`, `/login` |
| Onboarding + 4-week program | `/onboarding` |
| Next-session countdown | Dashboard, top card |
| Set logging, ghost text, rest timer | `/workout/:id` |
| Exercise notes | `/workout/:id`, under each exercise name |
| Smart Swap | `/workout/:id`, ⇄ button |
| AI coaching brief | `/workout/:id`, top card |
| Template builder + AI routines | `/templates` |
| Monthly volume chart | Dashboard, bottom-left |
| Muscle recovery body map | Dashboard, bottom-right |
| Calendar export (.ics) | Dashboard, **Sync to Calendar** |

---

## Report issues

If something doesn't match a ✅ above, note the step number (e.g. "3.4") and what you saw, and I'll fix it on `develop`.
