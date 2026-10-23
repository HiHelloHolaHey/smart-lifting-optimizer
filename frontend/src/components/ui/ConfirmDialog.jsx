import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { buttonVariants } from './Button';
import { cn } from '../../utils/cn';

/**
 * shadcn/ui AlertDialog (ConfirmDialog) built on @radix-ui/react-alert-dialog.
 * Replaces window.confirm with accessible focus management and keyboard support.
 */
const ConfirmDialog = ({ isOpen, title, message, actions = [], onClose, tone = 'default' }) => (
  <AlertDialogPrimitive.Root open={Boolean(isOpen)} onOpenChange={(open) => !open && onClose?.()}>
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-bg/85 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]"
      />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 text-text focus:outline-none animate-[fadeIn_.15s_ease-out]">
        <div className="mb-3 flex items-center gap-3">
          {tone === 'danger' && (
            <span className="rounded-full bg-danger/15 p-2 text-danger" aria-hidden="true">
              <AlertTriangle className="h-5 w-5" />
            </span>
          )}
          <AlertDialogPrimitive.Title className="font-display text-lg font-medium text-text">
            {title}
          </AlertDialogPrimitive.Title>
        </div>
        <AlertDialogPrimitive.Description className="mb-6 text-sm leading-relaxed text-text-muted">
          {message || title}
        </AlertDialogPrimitive.Description>
        <div className="flex flex-col gap-2">
          {actions.map((a, i) => (
            <button
              key={a.label}
              type="button"
              autoFocus={i === 0}
              onClick={a.onClick}
              disabled={a.disabled}
              className={cn(buttonVariants({ variant: a.variant || 'ghost', size: 'md' }), 'w-full')}
            >
              {a.label}
            </button>
          ))}
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  </AlertDialogPrimitive.Root>
);

export default ConfirmDialog;
