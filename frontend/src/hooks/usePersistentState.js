import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useState that mirrors to localStorage so in-progress input survives refreshes.
 * Writes are debounced slightly; also flushed on pagehide/unload.
 * @template T
 * @param {string} key
 * @param {T} initial
 * @returns {[T, (v: T | ((prev: T) => T)) => void, () => void]} [value, setValue, clear]
 */
export const usePersistentState = (key, initial) => {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ }
    }, 150);
    return () => clearTimeout(t);
  }, [key, value]);

  useEffect(() => {
    const flush = () => {
      try { localStorage.setItem(key, JSON.stringify(latest.current)); } catch { /* ignore */ }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [key]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }, [key]);

  return [value, setValue, clear];
};
