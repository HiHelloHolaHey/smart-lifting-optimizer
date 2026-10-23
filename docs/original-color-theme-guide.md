# Original Workout App: Color Theme Guide (Electric Indigo & Deep Slate)

Saved snapshot of the original neon-accented dark theme prior to applying `docs/premium-color-theme-guide.md`.

> **Quick Revert Command:**
> To immediately restore the entire frontend to this original theme via Git:
> ```bash
> git checkout 9783082 -- frontend/
> ```

---

## Core Palette (Dark Mode — Deep Slate & Electric Indigo)

| Role | Tailwind Class / Token | Hex | Used for |
|---|---|---|---|
| Background | `bg-slate-950` | `#0F172A` | App canvas |
| Surface / Card | `bg-slate-800/60`, `bg-slate-900` | `#1E293B` (60%) / `#0F172A` | Glass cards, modals, sidebar |
| Raised / Input | `bg-slate-900/80`, `bg-slate-800` | `#0F172A` (80%) / `#1E293B` | Inputs, progress tracks, chips |
| Border | `border-slate-700/50`, `border-slate-800` | `#334155` / `#1E293B` | Card outlines, dividers |
| Text | `text-slate-100`, `text-slate-200` | `#F1F5F9` / `#E2E8F0` | Primary text |
| Muted text | `text-slate-400`, `text-slate-500` | `#94A3B8` / `#64748B` | Secondary text, labels |
| Primary Accent | `electric-indigo` / `indigo-500` | `#6366F1` | Primary buttons, active tabs, chart line |
| Secondary Accent | `indigo-400` | `#818CF8` | Active nav links, hover states, icons |
| On Accent | `text-white` | `#FFFFFF` | Text on primary buttons |
| AI / Rest Accent | `cyan-300` / `cyan-400` | `#67E8F9` / `#22D3EE` | AI Coach card, Rest timer, bar chart top stop |
| Success | `emerald-400` / `emerald-500` / `green-400` | `#34D399` / `#10B981` | Completed sets, in-progress workout HUD |
| Warning | `amber-400` / `yellow-400` | `#FBBF24` / `#FACC15` | Warm-up sets, caution badges |
| Danger | `red-400` / `red-500` | `#F87171` / `#EF4444` | Delete, discard, validation errors |

---

## Typography

- **Font Family:** `Inter, system-ui, sans-serif`
- **Google Fonts Link (`frontend/index.html`):**
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```

---

## Original `frontend/tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        'electric-indigo': '#6366F1',
        'slate-950': '#0F172A',
        'indigo-400': '#818CF8'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      }
    },
  },
  plugins: [],
}
```

---

## Original `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { 
    @apply bg-slate-950 text-slate-100 font-sans; 
  }
  ::-webkit-scrollbar { 
    @apply w-1.5; 
  }
  ::-webkit-scrollbar-track { 
    @apply bg-slate-900; 
  }
  ::-webkit-scrollbar-thumb { 
    @apply bg-slate-700 rounded-full; 
  }
}

@layer components {
  .glass-card { 
    @apply backdrop-blur-md bg-slate-800/60 border border-slate-700/50 rounded-2xl; 
  }
  .btn-primary { 
    @apply bg-electric-indigo hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 active:scale-95; 
  }
  .btn-ghost { 
    @apply bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 font-medium px-5 py-2.5 rounded-xl transition-all duration-200; 
  }
  .input-field { 
    @apply bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all w-full; 
  }
}

@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }
```

---

## Component-Specific Color Reference

- **Dashboard Next Session Card:** `border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-slate-900` with glow `bg-electric-indigo/10 blur-3xl`
- **Dashboard In-Progress Card:** `border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 to-slate-900`
- **Dashboard Weekly Heatmap (`HEAT`):** `['bg-slate-800', 'bg-indigo-900', 'bg-indigo-700', 'bg-indigo-500', 'bg-electric-indigo']`
- **Dashboard AreaChart (`Volume Progress`):**
  - Stroke: `#6366F1`
  - Gradient: `#6366F1` (`0.3` → `0`)
  - Grid: `#1E293B`, Axis ticks: `#64748B`, Tooltip bg: `#0F172A`, border: `#1E293B`
- **Monthly Volume BarChart (`MonthlyVolumeChart.jsx`):**
  - Linear gradient: `#22d3ee` (`0%`) → `#6366F1` (`100%`)
  - Grid: `#1E293B`, Axis ticks: `#64748B`
- **Muscle Recovery Body Map (`MuscleBodyMap.jsx`):**
  - Formula: ``const colorFor = (fatigue) => `hsl(${Math.round(142 - Math.min(100, fatigue) * 1.42)}, 75%, ${46 - Math.min(100, fatigue) * 0.06}%)`;``
  - SVG stroke: `#0f172a`
- **AI Coach Brief (`WorkoutPage.jsx`):**
  - Container: `rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-indigo-500/10 p-4`
  - Header label: `text-cyan-300`
- **Rest Timer (`RestTimer.jsx`):**
  - Container: `border-cyan-400/20 bg-cyan-400/5`
  - Progress bar: `bg-gradient-to-r from-cyan-400 to-indigo-500`
