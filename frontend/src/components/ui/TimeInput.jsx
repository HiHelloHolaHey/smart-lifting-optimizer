import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const range = (n) => Array.from({ length: n }, (_, i) => i);

const parse = (value) => {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(value || '');
  if (!m) return { h: '00', m: '00' };
  return { h: pad(Math.min(23, +m[1])), m: pad(Math.min(59, +m[2])) };
};

const clamp = (raw, max) => {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return '00';
  return pad(Math.max(0, Math.min(max, n)));
};

const TimeInput = ({ value = '00:00', onChange, label, id, disabled = false }) => {
  const base = id || 'time-input';
  const parsed = parse(value);
  const [hText, setHText] = useState(parsed.h);
  const [mText, setMText] = useState(parsed.m);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const hListRef = useRef(null);
  const mListRef = useRef(null);

  // Sync typed text when the value prop changes externally
  useEffect(() => {
    const p = parse(value);
    setHText(p.h);
    setMText(p.m);
  }, [value]);

  // Outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Scroll selected into view on open
  useEffect(() => {
    if (!open) return;
    [hListRef.current, mListRef.current].forEach((list) => {
      const sel = list?.querySelector('[aria-selected="true"]');
      if (list && sel) list.scrollTop = sel.offsetTop - list.clientHeight / 2 + sel.clientHeight / 2;
    });
  }, [open]);

  const commit = (h, m) => onChange?.(`${h}:${m}`);

  const handleText = (setter) => (e) => setter(e.target.value.replace(/\D/g, '').slice(0, 2));

  const blurH = () => {
    const h = clamp(hText, 23);
    setHText(h);
    commit(h, clamp(mText, 59));
  };
  const blurM = () => {
    const m = clamp(mText, 59);
    setMText(m);
    commit(clamp(hText, 23), m);
  };

  const step = (part) => (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const max = part === 'h' ? 23 : 59;
    const cur = parseInt(part === 'h' ? hText : mText, 10) || 0;
    const next = pad(Math.max(0, Math.min(max, cur + (e.key === 'ArrowUp' ? 1 : -1))));
    if (part === 'h') {
      setHText(next);
      commit(next, clamp(mText, 59));
    } else {
      setMText(next);
      commit(clamp(hText, 23), next);
    }
  };

  const pick = (part, n) => {
    const v = pad(n);
    if (part === 'h') {
      setHText(v);
      commit(v, clamp(mText, 59));
    } else {
      setMText(v);
      commit(clamp(hText, 23), v);
    }
  };

  const selH = parsed.h;
  const selM = parsed.m;

  const itemCls = (active) =>
    `w-full py-1.5 text-center text-sm rounded-lg transition-colors ${
      active ? 'bg-electric-indigo text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/60'
    }`;

  const numCls =
    'input-field !w-14 !px-0 text-center tabular-nums disabled:opacity-50';

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <label htmlFor={`${base}-h`} className="block text-sm font-medium text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2" role="group" aria-label={label || 'Time'}>
        <input
          id={`${base}-h`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          className={numCls}
          value={hText}
          disabled={disabled}
          aria-label={`${label || 'Time'} hours`}
          onChange={handleText(setHText)}
          onFocus={(e) => e.target.select()}
          onBlur={blurH}
          onKeyDown={step('h')}
        />
        <span className="text-slate-400 font-semibold">:</span>
        <input
          id={`${base}-m`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          className={numCls}
          value={mText}
          disabled={disabled}
          aria-label={`${label || 'Time'} minutes`}
          onChange={handleText(setMText)}
          onFocus={(e) => e.target.select()}
          onBlur={blurM}
          onKeyDown={step('m')}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-label="Choose time from list"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex items-center justify-center w-11 h-11 rounded-xl border border-slate-600 bg-slate-800/60 text-slate-300 hover:border-electric-indigo hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-1.5">Type a time or pick from the list</p>

      {open && (
        <div
          role="dialog"
          aria-label="Choose time"
          className="absolute z-30 mt-2 p-3 rounded-2xl border border-slate-700 bg-slate-900 shadow-xl w-60"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs text-slate-500 text-center mb-1">Hour</div>
              <div
                ref={hListRef}
                className="relative h-48 overflow-y-auto space-y-0.5 pr-1"
                style={{ overscrollBehavior: 'contain' }}
              >
                {range(24).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="option"
                    aria-selected={pad(n) === selH}
                    onClick={() => pick('h', n)}
                    className={itemCls(pad(n) === selH)}
                  >
                    {pad(n)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 text-center mb-1">Minute</div>
              <div
                ref={mListRef}
                className="relative h-48 overflow-y-auto space-y-0.5 pr-1"
                style={{ overscrollBehavior: 'contain' }}
              >
                {range(60).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="option"
                    aria-selected={pad(n) === selM}
                    onClick={() => pick('m', n)}
                    className={itemCls(pad(n) === selM)}
                  >
                    {pad(n)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-primary w-full mt-3 py-2 text-sm"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeInput;
