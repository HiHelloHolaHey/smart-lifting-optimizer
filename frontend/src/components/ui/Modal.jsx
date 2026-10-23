import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * shadcn/ui Dialog (Modal) built on @radix-ui/react-dialog.
 * Provides full focus trapping, Escape handling, backdrop click, and WAI-ARIA dialog semantics.
 */
export const Modal = ({ isOpen, onClose, title, description, className, children }) => (
  <DialogPrimitive.Root open={Boolean(isOpen)} onOpenChange={(open) => !open && onClose?.()}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]" />
      <DialogPrimitive.Content
        aria-describedby={description ? undefined : undefined}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface text-text shadow-none focus:outline-none animate-[fadeIn_.15s_ease-out]',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <DialogPrimitive.Title className="font-display text-xl font-medium text-text">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-xs text-text-muted">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-raised hover:text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </div>
        <div className="p-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
