import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  Moon,
  Sun,
  LogOut,
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
  try {
    await authService.logout();  // wait for backend to clear cookies
  } catch {
    // swallow - still log out locally even if request fails
  } finally {
    clearAuth();
    queryClient.clear();
    window.location.replace('/login');
  }
};

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border dark:border-border-dark bg-bg-2 dark:bg-bg-dark-2 sticky top-0 h-screen">
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
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-bg-2 dark:bg-bg-dark-2 flex flex-col lg:hidden"
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
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-bg-2/80 dark:bg-bg-dark-2/80 backdrop-blur-md border-b border-border dark:border-border-dark">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-text-heading dark:text-text-dark-h" />
          </button>
          <div className="flex items-center">
            <span className="font-heading font-extrabold text-xl tracking-tighter text-text-heading dark:text-text-dark-h">
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
        <div className="flex items-center">
          <span className="font-heading font-extrabold text-2xl tracking-tighter text-text-heading dark:text-text-dark-h">
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
                  ? 'bg-accent-bg text-accent'
                  : 'text-text-muted dark:text-text-dark hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-heading dark:hover:text-text-dark-h',
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 pt-4 border-t border-border dark:border-border-dark">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted dark:text-text-dark hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-heading dark:hover:text-text-dark-h transition-all"
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
                ? 'bg-accent-bg text-accent'
                : 'text-text-muted dark:text-text-dark hover:bg-black/5 dark:hover:bg-white/5',
            )
          }
        >
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg">
  {initials}
</div>

          <span className="truncate">{userName}</span>
        </NavLink>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
