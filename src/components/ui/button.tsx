import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#445c8c] text-white shadow-[var(--shadow-button)] hover:bg-[#364a70] dark:bg-[#445c8c] dark:hover:bg-[#364a70]',
        destructive:
          'bg-red-600 text-white shadow-[var(--shadow-button)] hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400',
        outline:
          'border border-[#ccccbe] bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--muted)]',
        secondary:
          'bg-[#c4d4e4] text-[#445c8c] shadow-[var(--shadow-button)] hover:bg-[#d4e0ec] dark:bg-[#364a70] dark:text-[#c4d4e4] dark:hover:bg-[#445c8c]',
        ghost:
          'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
        link:
          'text-[#445c8c] underline-offset-4 hover:underline dark:text-[#a4dca7]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6',
        xl: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-9 w-9',
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
