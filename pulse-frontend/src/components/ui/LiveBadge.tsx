import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface LiveBadgeProps {
  label?: string;
  className?: string;
  variant?: 'red' | 'green' | 'purple';
}

const variantStyles = {
  red: 'bg-danger/10 text-danger border-danger/20',
  green: 'bg-success/10 text-success border-success/20',
  purple: 'bg-accent-bg text-accent border-accent-border',
};

const dotStyles = {
  red: 'bg-danger',
  green: 'bg-success',
  purple: 'bg-accent',
};

export function LiveBadge({
  label = 'LIVE',
  className,
  variant = 'red',
}: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide',
        variantStyles[variant],
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <motion.span
          className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', dotStyles[variant])}
          animate={{ scale: [1, 2, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotStyles[variant])} />
      </span>
      {label}
    </span>
  );
}
