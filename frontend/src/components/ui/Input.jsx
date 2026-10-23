import React from 'react';
import { cn } from '../../utils/cn';

/**
 * shadcn/ui Input primitive using --raised surface and --border outline.
 */
export const Input = React.forwardRef(({ className, type = 'text', error = false, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'input-field disabled:cursor-not-allowed disabled:opacity-50',
      error && '!border-danger focus:!border-danger focus:!ring-danger/40',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
