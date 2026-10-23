import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * In-app confirmation popup (replaces window.confirm).
 * `actions`: [{ label, onClick, variant: 'primary'|'danger'|'ghost' }] — rendered in order.
 */
const ConfirmDialog = ({ isOpen, title, message, actions = [], onClose, tone = 'default' }) => {
  const firstRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    firstRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles = {
    primary: 'bg-accent hover:opacity-90 text-on-accent',
    danger: 'bg-danger/15 hover:bg-danger/25 border border-danger/40 text-danger',
    ghost: 'bg-raised hover:border-accent/50 border border-border text-text',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/85 p-4 backdrop-blur-sm" role="presentation">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 animate-[fadeIn_.15s_ease-out]"
      >
        <div className="mb-3 flex items-center gap-3">
          {tone === 'danger' && (
            <span className="rounded-full bg-danger/15 p-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </span>
          )}
          <h2 id="confirm-title" className="text-lg font-medium text-text">
            {title}
          </h2>
        </div>
        {message && (
          <p id="confirm-message" className="mb-6 text-sm leading-relaxed text-text-muted">
            {message}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {actions.map((a, i) => (
            <button
              key={a.label}
              type="button"
              ref={i === 0 ? firstRef : undefined}
              onClick={a.onClick}
              disabled={a.disabled}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.99] disabled:opacity-50 ${styles[a.variant || 'ghost']}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
