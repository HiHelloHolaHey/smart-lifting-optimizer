import React from 'react';
import { cn } from '../../utils/cn';

/**
 * shadcn/ui Label primitive.
 */
export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('mb-1.5 block text-sm font-medium text-text-muted peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
    {...props}
  />
));
Label.displayName = 'Label';
