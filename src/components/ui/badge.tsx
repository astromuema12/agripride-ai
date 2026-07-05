import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]',
        primary: 'border-transparent bg-[#c4d4e4] text-[#445c8c] dark:bg-[#364a70] dark:text-[#a4dca7]',
        secondary: 'border-transparent bg-[#e8ecf3] text-[#445c8c] dark:bg-[#283854] dark:text-[#c4d4e4]',
        destructive: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
        warning: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
        outline: 'border-[var(--border)] text-[var(--muted-foreground)]',
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
