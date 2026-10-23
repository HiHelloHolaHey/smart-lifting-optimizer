import React from 'react';

/**
 * Principle: Pair status colors with a dot or icon plus a label. Never rely on color alone.
 */
export const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-raised text-text-muted border-border',
    success: 'bg-success/15 text-success border-success/35',
    warning: 'bg-warning/15 text-warning border-warning/35',
    danger: 'bg-danger/15 text-danger border-danger/35',
    info: 'bg-raised text-accent border-accent/35',
    ai: 'bg-ai-tint text-ai border-ai/30',
  };

  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-accent',
    ai: 'bg-ai',
  };

  const dot = dotColors[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.default} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />}
      {children}
    </span>
  );
};
