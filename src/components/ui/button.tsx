import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none font-body',
  {
    variants: {
      variant: {
        default:
          'bg-[#1a3a2a] text-white hover:bg-[#142e21] dark:bg-[#5e9a6b] dark:hover:bg-[#4a8a5a]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]',
        secondary:
          'bg-[#f0f5f1] text-[#1a3a2a] hover:bg-[#dce8de] dark:bg-[#1a2e20] dark:text-[#5e9a6b] dark:hover:bg-[#223822]',
        ghost:
          'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
        terra:
          'bg-[#c4704b] text-white hover:bg-[#a85a3a] dark:bg-[#e8a07a] dark:hover:bg-[#d98356] dark:text-[#3b362e]',
        link:
          'text-[#2d6a4f] underline-offset-4 hover:underline dark:text-[#5e9a6b]',
      },
      size: {
        default: 'h-10 px-5 py-2 rounded-lg',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-7',
        xl: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-9 w-9 rounded-lg',
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
