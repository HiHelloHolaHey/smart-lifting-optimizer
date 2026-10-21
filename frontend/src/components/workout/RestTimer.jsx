import React, { useEffect, useRef, useState } from 'react';
import { Plus, Minus, SkipForward } from 'lucide-react';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Countdown bar shown beneath a completed set. Based on an absolute `endsAt`
 * timestamp so it stays correct across refreshes and background tabs.
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
      const t = setTimeout(() => doneRef.current(), 1500); // linger briefly on "Go!"
      return () => clearTimeout(t);
    }
  }, [remaining]);

  return (
    <div className="col-span-full px-2 pb-3" role="timer" aria-live="off">
      <div className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-2.5">
        <span className={`w-14 text-center font-mono text-lg font-bold ${remaining === 0 ? 'text-emerald-400' : 'text-cyan-300'}`}>
          {remaining === 0 ? 'Go!' : fmt(remaining)}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-[width] duration-300 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button type="button" aria-label="Subtract 15 seconds" onClick={() => onAdjust(-15)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Add 15 seconds" onClick={() => onAdjust(15)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Skip rest" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300">
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default RestTimer;
