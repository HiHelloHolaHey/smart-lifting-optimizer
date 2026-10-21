import React from 'react';
import { Check } from 'lucide-react';

/**
 * One set row: label (number or "W"), previous-performance ghost text,
 * weight input, reps input, one-tap completion checkbox.
 */
const SetRow = ({ set, label, previous, values, onChange, onToggle }) => {
  const done = set.completed;
  const isWarmup = set.set_type === 'warmup';
  const inputCls = `w-full rounded-lg border bg-slate-900/80 px-2 py-2 text-center text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500/60 ${
    done ? 'border-emerald-500/30 text-emerald-200' : 'border-slate-700 text-slate-100 focus:border-indigo-500'
  }`;

  return (
    <div className={`grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.75rem] items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${done ? 'bg-emerald-500/5' : ''}`}>
      <span className={`text-center text-sm font-bold ${isWarmup ? 'text-amber-400' : 'text-slate-400'}`} title={isWarmup ? 'Warm-up set' : `Set ${label}`}>
        {label}
      </span>
      <span className="truncate text-xs italic text-slate-600">
        {previous ? `${Number(previous.weight_kg)} kg x ${previous.reps}` : '—'}
      </span>
      <input
        type="number" inputMode="decimal" step="0.5" min="0" aria-label={`Weight for set ${label}`}
        className={inputCls}
        placeholder={previous ? String(Number(previous.weight_kg)) : 'kg'}
        value={values.weight}
        onChange={(e) => onChange('weight', e.target.value)}
      />
      <input
        type="number" inputMode="numeric" min="0" aria-label={`Reps for set ${label}`}
        className={inputCls}
        placeholder={previous ? String(previous.reps) : 'reps'}
        value={values.reps}
        onChange={(e) => onChange('reps', e.target.value)}
      />
      <button
        type="button" role="checkbox" aria-checked={done} aria-label={`Mark set ${label} ${done ? 'incomplete' : 'complete'}`}
        onClick={onToggle}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all active:scale-90 ${
          done
            ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
            : 'border-slate-600 bg-slate-800 text-transparent hover:border-emerald-400/60'
        }`}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>
    </div>
  );
};

export default SetRow;
