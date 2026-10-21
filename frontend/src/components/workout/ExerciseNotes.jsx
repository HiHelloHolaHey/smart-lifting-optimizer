import React, { useState } from 'react';
import { ChevronDown, StickyNote } from 'lucide-react';

/** Collapsible per-exercise form/mobility notes. Saves on blur. */
const ExerciseNotes = ({ value, onChange, onSave }) => {
  const [open, setOpen] = useState(Boolean(value));

  return (
    <div className="border-b border-slate-800/80 px-5 py-2">
      <button
        type="button" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200"
      >
        <StickyNote className="h-3.5 w-3.5" />
        Notes{value && !open ? ' •' : ''}
        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <textarea
          rows={2} maxLength={2000}
          className="mt-1 mb-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          placeholder="Form cues, mobility notes (e.g. left knee feels better today)…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onSave}
        />
      )}
    </div>
  );
};

export default ExerciseNotes;
