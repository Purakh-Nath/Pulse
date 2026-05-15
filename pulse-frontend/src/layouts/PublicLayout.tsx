import { Outlet, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

export function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#0F1115] flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-[#171A21]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#6C63FF] to-[#FF6B6B] rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading font-bold text-[#111] dark:text-white">
              Pulse
            </span>
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-[#6C63FF] hover:text-[#FF6B6B] transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-[#5E5E5E] dark:text-gray-400 hover:text-[#6C63FF] transition-colors"
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

      <footer className="py-6 text-center text-xs text-[#5E5E5E] dark:text-gray-500">
        Powered by{' '}
        <Link to="/" className="text-[#6C63FF] hover:underline">
          Pulse
        </Link>
      </footer>
    </div>
  );
}
