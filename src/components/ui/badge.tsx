import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-100 text-gray-800 dark:bg-[var(--muted)] dark:text-gray-300',
        primary: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
        secondary: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
        destructive: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
        warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
        outline: 'text-gray-700 dark:text-gray-400 dark:border-gray-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
