import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard shadcn/ui class name merger (clsx + tailwind-merge).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
