import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  placement?: 'bottom' | 'right';
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  placement = 'right',
  title,
  footer,
  children,
  className,
}: DrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isBottom = placement === 'bottom';

  // Animation variants
  const slideVariants = {
    hidden: isBottom ? { y: '100%' } : { x: '100%' },
    visible: isBottom ? { y: 0 } : { x: 0 },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            key="drawer-panel"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={slideVariants}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            className={cn(
              'fixed z-50 flex flex-col bg-bg dark:bg-bg-dark shadow-2xl',
              isBottom
                ? 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl'
                : 'inset-y-0 right-0 w-full max-w-sm sm:max-w-md',
              className
            )}
          >
            {/* Header Slot */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark shrink-0">
                <div className="font-heading text-lg font-semibold text-text-heading dark:text-text-dark-h">
                  {title}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5 text-text-muted dark:text-text-dark" />
                </button>
              </div>
            )}
            
            {!title && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5 text-text-muted dark:text-text-dark" />
                </button>
              </div>
            )}

            {/* Body Slot */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </div>

            {/* Footer Slot */}
            {footer && (
              <div className="shrink-0 p-4 border-t border-border dark:border-border-dark bg-bg dark:bg-bg-dark">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
