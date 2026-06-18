
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save, LogOut, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { usersService } from '@/api/users';
import { authService } from '@/api/auth';
import { queryKeys } from '@/config/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useTheme } from '@/providers/ThemeProvider';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { resolvedTheme, toggleTheme } = useTheme();
  
  const { data: userProfile, isLoading } = useQuery({
    queryKey: queryKeys.user,
    queryFn: usersService.getMe,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: userProfile?.name || '',
    },
  });

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: usersService.updateMe,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.user, updatedUser);
      useAuthStore.getState().setUser(updatedUser); // sync basic auth state
      toast.success('Profile updated successfully');
      reset({ name: updatedUser.name });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleLogoutAll = async () => {
    try {
      await authService.logoutAll();
      clearAuth();
      queryClient.clear();
      window.location.href = '/login';
    } catch {
      toast.error('Failed to log out of all sessions');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-text-heading dark:text-text-dark-h mb-8">
        Profile & Settings
      </h1>

      <div className="space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-semibold text-text-heading dark:text-text-dark-h flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-accent" />
              Personal Information
            </h2>

            <form onSubmit={handleSubmit((data) => updateProfile(data))} className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-warning flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg hover:shadow-xl transition-shadow duration-300 select-none cursor-pointer">
  {userProfile?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)}
</div>

                <div>
                  <div className="text-sm font-medium text-text-muted dark:text-text-dark mb-1 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {userProfile?.email}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Connected via Google
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-heading dark:text-text-dark-h mb-2">
                  Display Name
                </label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-2.5 bg-bg-2 dark:bg-bg-dark-2 border border-border dark:border-border-dark rounded-xl text-text-heading dark:text-text-dark-h focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                />
                {errors.name && (
                  <p className="text-danger text-xs mt-1.5">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-border dark:border-border-dark">
                <Button
                  type="submit"
                  disabled={!isDirty || isUpdating}
                  loading={isUpdating}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* App Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 md:p-8"
        >
          <h2 className="text-lg font-semibold text-text-heading dark:text-text-dark-h flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-accent" />
            App Settings
          </h2>
          <div className="space-y-6">
            <ToggleSwitch
              checked={resolvedTheme === 'dark'}
              onChange={toggleTheme}
              label="Dark Mode"
              description="Switch between light and dark themes"
            />
          </div>
        </motion.div>

        {/* Security Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 md:p-8 border-danger/20"
        >
          <h2 className="text-lg font-semibold text-text-heading dark:text-text-dark-h flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-danger" />
            Security
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-text-heading dark:text-text-dark-h mb-1">
                Log out of all devices
              </div>
              <div className="text-sm text-text-muted dark:text-text-dark">
                Invalidate all active sessions across all your devices.
              </div>
            </div>
            <Button
              variant="danger"
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogoutAll}
            >
              Log Out All
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
