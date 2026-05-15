import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface LiveBadgeProps {
  label?: string;
  className?: string;
  variant?: 'red' | 'green' | 'purple';
}

const variantStyles = {
  red: 'bg-[#FF5A5F]/10 text-[#FF5A5F] border-[#FF5A5F]/20',
  green: 'bg-[#3DDC97]/10 text-[#3DDC97] border-[#3DDC97]/20',
  purple: 'bg-[#6C63FF]/10 text-[#6C63FF] border-[#6C63FF]/20',
};

const dotStyles = {
  red: 'bg-[#FF5A5F]',
  green: 'bg-[#3DDC97]',
  purple: 'bg-[#6C63FF]',
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
