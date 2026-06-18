import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-20 px-6',
        className,
      )}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="mb-6 text-accent/40"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="font-heading text-2xl font-semibold text-text-heading dark:text-text-dark-h mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-text-muted dark:text-text-dark max-w-xs text-sm leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  );
}
