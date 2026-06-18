import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className,
  hover = false,
  onClick,
  padding = 'md',
}: CardProps) {
  const Component = hover || onClick ? motion.div : 'div';

  const props =
    hover || onClick
      ? {
          whileHover: { y: -2, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' },
          transition: { type: 'spring', stiffness: 400, damping: 30 },
          onClick,
          style: { cursor: onClick ? 'pointer' : 'default' },
        }
      : { onClick };

  return (
    <Component
      className={cn(
        'card',
        paddings[padding],
        'relative overflow-hidden',
        className,
      )}
      {...(props as object)}
    >
      {children}
    </Component>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        'font-heading text-lg font-semibold text-text-heading dark:text-text-dark-h',
        className,
      )}
    >
      {children}
    </h3>
  );
}
