import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-sm hover:shadow-md',
  secondary:
    'bg-bg dark:bg-bg-dark text-text-heading dark:text-text-dark-h border border-border dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5',
  ghost:
    'text-text-heading dark:text-text-dark-h hover:bg-black/5 dark:hover:bg-white/5',
  danger:
    'bg-danger text-white hover:bg-danger/80 active:scale-[0.98]',
  outline:
    'border-2 border-accent text-accent hover:bg-accent-bg',
};

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
  xl: 'h-14 px-8 text-lg rounded-2xl gap-3',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
  iconLeft?:React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 font-body select-none whitespace-nowrap gap-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
        {!loading && iconRight && (
          <span className="shrink-0">{iconRight}</span>
        )}
      </motion.button>
    );
  },
);


Button.displayName = 'Button';
