import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * shadcn/ui Badge primitive with automatic status dot indicator.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-raised text-text-muted border-border',
        secondary: 'bg-raised text-text border-border',
        success: 'bg-success/15 text-success border-success/35',
        warning: 'bg-warning/15 text-warning border-warning/35',
        danger: 'bg-danger/15 text-danger border-danger/35',
        destructive: 'bg-danger/15 text-danger border-danger/35',
        info: 'bg-raised text-accent border-accent/35',
        ai: 'bg-ai-tint text-ai border-ai/45 font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const DOT_COLORS = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  destructive: 'bg-danger',
  info: 'bg-accent',
  ai: 'bg-ai',
};

export const Badge = ({ variant = 'default', className, children, ...props }) => {
  const dot = DOT_COLORS[variant];
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />}
      {children}
    </span>
  );
};
