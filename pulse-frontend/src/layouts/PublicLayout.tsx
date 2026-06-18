import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

export function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-30 border-b border-border dark:border-border-dark bg-bg-2/80 dark:bg-bg-dark-2/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="font-heading font-extrabold text-2xl tracking-tighter text-text-heading dark:text-text-dark-h">
              Pulse
            </span>
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-text-muted dark:text-text-dark hover:text-accent transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-text-muted dark:text-text-dark">
        Powered by{' '}
        <Link to="/" className="text-accent hover:underline">
          Pulse
        </Link>
      </footer>
    </div>
  );
}
