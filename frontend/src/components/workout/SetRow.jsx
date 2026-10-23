import React from 'react';
import { Check, Lock, Trophy } from 'lucide-react';

/**
 * One set row: label (number or "W"), previous-performance ghost text,
 * weight input, reps input, one-tap completion checkbox.
 * - `canLog=false` (workout not started): inputs stay editable as a plan but the tick is disabled.
 * - Completed sets are locked; un-tick to edit.
 */
const SetRow = ({ set, label, previous, values, placeholders, canLog, locked = false, onChange, onToggle }) => {
  const done = set.completed;
  const isWarmup = set.set_type === 'warmup';
  const inputCls = `w-full rounded-lg border bg-raised px-2 py-2 text-center text-sm font-medium tabular-nums focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:cursor-not-allowed ${
    done ? 'border-success/40 text-success opacity-85' : 'border-border text-text focus:border-accent'
  }`;
  const selectAll = (e) => e.target.select();

  return (
    <div className={`grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.75rem] items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${done ? 'bg-success/10' : ''}`}>
      <span className={`text-center text-sm font-medium ${isWarmup ? 'text-warning' : 'text-text-muted'}`} title={isWarmup ? 'Warm-up set' : `Set ${label}`}>
        {label}
      </span>
      <span className="flex items-center gap-1.5 truncate text-xs italic text-text-muted" title="Your previous performance for this set">
        {previous ? `${Number(previous.weight_kg)} kg × ${previous.reps}` : '—'}
        {set.new_pr && (
          <span
            className="inline-flex items-center gap-0.5 rounded bg-accent/20 px-1.5 py-0.5 font-mono text-[10px] font-bold not-italic text-accent"
            title={`New Estimated 1RM PR: ${set.estimated_1rm_kg} kg`}
          >
            <Trophy className="h-2.5 w-2.5" /> PR
          </span>
        )}
      </span>
      <input
        type="number" inputMode="decimal" step="0.5" min="0" aria-label={`Weight for set ${label}`}
        className={inputCls} disabled={done || locked} placeholder={placeholders.weight}
        value={values.weight} onFocus={selectAll} onChange={(e) => onChange('weight', e.target.value)}
      />
      <input
        type="number" inputMode="numeric" min="0" aria-label={`Reps for set ${label}`}
        className={inputCls} disabled={done || locked} placeholder={placeholders.reps}
        value={values.reps} onFocus={selectAll} onChange={(e) => onChange('reps', e.target.value)}
      />
      <button
        type="button" role="checkbox" aria-checked={done} disabled={locked || (!canLog && !done)}
        aria-label={canLog ? `Mark set ${label} ${done ? 'incomplete' : 'complete'}` : 'Start the workout to log sets'}
        title={canLog ? undefined : 'Press "Start Now" to begin logging'}
        onClick={onToggle}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all active:scale-95 disabled:cursor-not-allowed ${
          done
            ? 'border-success bg-success text-on-accent'
            : canLog
              ? 'border-border bg-raised text-transparent hover:border-success/60'
              : 'border-border bg-surface text-text-muted/50'
        }`}
      >
        {!canLog && !done ? <Lock className="h-4 w-4" /> : <Check className="h-5 w-5" strokeWidth={2.5} />}
      </button>
    </div>
  );
};

export default SetRow;
