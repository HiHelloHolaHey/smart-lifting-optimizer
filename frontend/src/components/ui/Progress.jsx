import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../utils/cn';

/**
 * shadcn/ui Progress primitive built on @radix-ui/react-progress.
 * Uses a thin progress line per the Premium Theme Guide.
 */
export const Progress = React.forwardRef(({ className, indicatorClassName, value = 0, ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={clamped}
      className={cn('relative h-1 w-full overflow-hidden rounded-full bg-raised', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 bg-accent transition-transform duration-300 ease-out', indicatorClassName)}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;
