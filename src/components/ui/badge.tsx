import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors font-body',
  {
    variants: {
      variant: {
        default: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
        primary: 'bg-[#f0f5f1] text-[#2d6a4f] dark:bg-[#1a2e20] dark:text-[#5e9a6b]',
        secondary: 'bg-[#f3efe9] text-[#756a5c] dark:bg-[#222822] dark:text-[#95928a]',
        destructive: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        outline: 'border border-[var(--border)] text-[var(--muted-foreground)]',
        terra: 'bg-[#fdf3ee] text-[#a85a3a] dark:bg-[#522b1e]/40 dark:text-[#e8a07a]',
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
