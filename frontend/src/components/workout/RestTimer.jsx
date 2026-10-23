import React, { useEffect, useRef, useState } from 'react';
import { Plus, Minus, SkipForward, Timer } from 'lucide-react';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Countdown bar shown beneath a completed set.
 * Uses --warning (rest/caution token) paired with icon + label and a thin progress line.
 */
const RestTimer = ({ endsAt, total, onAdjust, onDone }) => {
  const [now, setNow] = useState(Date.now());
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const pct = Math.min(100, Math.max(0, (remaining / total) * 100));

  useEffect(() => {
    if (remaining === 0) {
      const t = setTimeout(() => doneRef.current(), 1500);
      return () => clearTimeout(t);
    }
  }, [remaining]);

  return (
    <div className="col-span-full px-2 pb-3" role="timer" aria-live="off">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-raised p-2.5">
        <span className={`inline-flex w-20 items-center justify-center gap-1.5 font-mono text-sm font-medium tabular-nums ${remaining === 0 ? 'text-success' : 'text-warning'}`}>
          <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {remaining === 0 ? 'Ready' : fmt(remaining)}
        </span>
        {/* Thin progress line per theme guide */}
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-warning transition-[width] duration-300 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button type="button" aria-label="Subtract 15 seconds" onClick={() => onAdjust(-15)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text">
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Add 15 seconds" onClick={() => onAdjust(15)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text">
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Skip rest" onClick={onDone} className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text">
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default RestTimer;
