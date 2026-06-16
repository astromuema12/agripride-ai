import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] touch-manipulation select-none',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-emerald-400 dark:from-emerald-700 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-500 dark:shadow-emerald-500/10',
        destructive:
          'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:from-red-500 hover:to-red-400 dark:from-red-700 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-500',
        outline:
          'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-[var(--card)] dark:text-[var(--foreground)] dark:hover:border-gray-600 dark:hover:bg-[var(--muted)]',
        secondary:
          'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 shadow-sm hover:from-emerald-100 hover:to-emerald-200 hover:shadow-md hover:shadow-emerald-500/10 dark:from-emerald-900/50 dark:to-emerald-800/50 dark:text-emerald-300 dark:hover:from-emerald-800/50 dark:hover:to-emerald-700/50 dark:hover:shadow-emerald-500/5',
        ghost:
          'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[var(--muted)] dark:hover:text-[var(--foreground)]',
        link:
          'text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400',
      },
      size: {
        default: 'h-10 px-4 sm:px-5 py-2',
        sm: 'h-9 rounded-lg px-3 sm:px-4 text-xs',
        lg: 'h-11 rounded-xl px-6 sm:px-8',
        xl: 'h-12 sm:h-13 rounded-xl px-6 sm:px-10 text-sm sm:text-base',
        icon: 'h-9 w-9 sm:h-10 sm:w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
