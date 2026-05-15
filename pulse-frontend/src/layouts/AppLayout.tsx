import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  Moon,
  Sun,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/api/auth';
import { queryClient } from '@/providers/QueryProvider';
// import toast from 'react-hot-toast';
// import { queryKeys } from '@/config/queryKeys';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/new', icon: PlusCircle, label: 'New Poll' },
];

export function AppLayout() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  // const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // const handleLogout = async () => {
  //   try {
  //     await authService.logout();
  //   } catch {
  //     /* swallow */
  //   } finally {
  //     clearAuth();
  //     queryClient.removeQueries({ queryKey: queryKeys.me });
  //     queryClient.clear();
  //     navigate('/login');
  //     toast.success('Signed out successfully');
  //   }
  // };

const handleLogout = async () => {
  clearAuth();
  queryClient.clear();
  authService.logout().catch(() => {});
  window.location.replace('/login'); // hard redirect, kills everything
};

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#0F1115] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#171A21] sticky top-0 h-screen">
        <SidebarContent
          initials={initials ?? '?'}
          userName={user?.name ?? ''}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onClose={() => {}}
        />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-white dark:bg-[#171A21] flex flex-col lg:hidden"
            >
              <SidebarContent
                initials={initials ?? '?'}
                userName={user?.name ?? ''}
                resolvedTheme={resolvedTheme}
                onToggleTheme={toggleTheme}
                onLogout={handleLogout}
                onClose={() => setMobileOpen(false)}
                showClose
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — mobile */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/80 dark:bg-[#171A21]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06]">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-[#111] dark:text-white" />
          </button>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#6C63FF]" />
            <span className="font-heading font-bold text-[#111] dark:text-white">
              Pulse
            </span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <motion.div
            key="page-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  initials: string;
  userName: string;
  resolvedTheme: string;
  onToggleTheme: () => void;
  onLogout: () => void;
  onClose: () => void;
  showClose?: boolean;
}

function SidebarContent({
  initials,
  userName,
  resolvedTheme,
  onToggleTheme,
  onLogout,
  onClose,
  showClose,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <div className="flex items-center justify-between mb-8 px-2 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6C63FF] to-[#FF6B6B] rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg text-[#111] dark:text-white">
            Pulse
          </span>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[#6C63FF]/10 text-[#6C63FF]'
                  : 'text-[#5E5E5E] dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111] dark:hover:text-white',
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#5E5E5E] dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111] dark:hover:text-white transition-all"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <NavLink
          to="/dashboard/profile"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-[#6C63FF]/10 text-[#6C63FF]'
                : 'text-[#5E5E5E] dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5',
            )
          }
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#A0522D] to-[#CD853F] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg">
  {initials}
</div>

          <span className="truncate">{userName}</span>
        </NavLink>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#FF5A5F] hover:bg-[#FF5A5F]/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
