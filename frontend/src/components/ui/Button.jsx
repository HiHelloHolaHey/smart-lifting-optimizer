import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:opacity-90',
        default: 'bg-accent text-on-accent hover:opacity-90',
        ghost: 'bg-raised border border-border text-text hover:border-accent/60',
        secondary: 'bg-raised border border-border text-text hover:border-accent/60',
        outline: 'bg-transparent border border-border text-text hover:bg-raised hover:border-accent/60',
        danger: 'bg-danger/15 hover:bg-danger/25 border border-danger/40 text-danger',
        destructive: 'bg-danger/15 hover:bg-danger/25 border border-danger/40 text-danger',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-11 px-5 py-2.5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-9 w-9 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', asChild = false, loading = false, icon: Icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
