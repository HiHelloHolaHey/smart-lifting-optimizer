import React, { useState, useEffect, useRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

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

/**
 * shadcn/ui Popover-backed 24-hour TimeInput (typeable numeric inputs + non-looping scrollable lists).
 */
const TimeInput = ({ value = '00:00', onChange, label, id, disabled = false }) => {
  const base = id || 'time-input';
  const parsed = parse(value);
  const [hText, setHText] = useState(parsed.h);
  const [mText, setMText] = useState(parsed.m);
  const [open, setOpen] = useState(false);
  const hListRef = useRef(null);
  const mListRef = useRef(null);

  useEffect(() => {
    const p = parse(value);
    setHText(p.h);
    setMText(p.m);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      [hListRef.current, mListRef.current].forEach((list) => {
        const sel = list?.querySelector('[aria-selected="true"]');
        if (list && sel) list.scrollTop = sel.offsetTop - list.clientHeight / 2 + sel.clientHeight / 2;
      });
    }, 10);
    return () => clearTimeout(t);
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
    cn(
      'w-full py-1.5 text-center text-sm rounded-lg transition-colors',
      active ? 'bg-accent text-on-accent font-medium' : 'text-text-muted hover:bg-raised hover:text-text'
    );

  const numCls = 'input-field !w-14 !px-0 text-center tabular-nums disabled:opacity-50';

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <div>
        {label && (
          <label htmlFor={`${base}-h`} className="mb-1.5 block text-sm font-medium text-text-muted">
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
          <span className="font-semibold text-text-muted">:</span>
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
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Choose time from list"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-raised text-text-muted transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-50"
            >
              <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} />
            </button>
          </PopoverPrimitive.Trigger>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">Type a time or pick from the list</p>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={8}
            className="z-50 w-60 rounded-2xl border border-border bg-surface p-3 text-text focus:outline-none animate-[fadeIn_.12s_ease-out]"
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="mb-1 text-center text-xs text-text-muted">Hour</div>
                <div
                  ref={hListRef}
                  className="relative h-48 space-y-0.5 overflow-y-auto pr-1"
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
                <div className="mb-1 text-center text-xs text-text-muted">Minute</div>
                <div
                  ref={mListRef}
                  className="relative h-48 space-y-0.5 overflow-y-auto pr-1"
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
            <PopoverPrimitive.Close asChild>
              <button type="button" className="btn-primary mt-3 w-full py-2 text-sm">
                Done
              </button>
            </PopoverPrimitive.Close>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </div>
    </PopoverPrimitive.Root>
  );
};

export default TimeInput;
