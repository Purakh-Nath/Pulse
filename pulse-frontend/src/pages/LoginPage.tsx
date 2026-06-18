import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authService } from '@/api/auth';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    authService.initiateLogin();
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[#111] dark:text-white mb-2">
        Welcome back
      </h1>
      <p className="text-[#5E5E5E] dark:text-gray-400 mb-8">
        Sign in to your Pulse account to continue.
      </p>

      <Button
        size="lg"
        variant="secondary"
        className="w-full"
        onClick={handleGoogleLogin}
        icon={
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        }
      >
        Continue with Google
      </Button>

      <div className="mt-8 p-4 bg-[#6C63FF]/5 rounded-xl border border-[#6C63FF]/10">
        <div className="flex gap-3">
          <Shield className="w-4 h-4 text-[#6C63FF] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-[#6C63FF] mb-0.5">
              Secure, private sign-in
            </p>
            <p className="text-xs text-[#5E5E5E] dark:text-gray-400">
              We use Google OAuth. We never see your password. Your session is managed via secure HTTP-only cookies.
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-[#5E5E5E] dark:text-gray-400 mt-8">
        By continuing, you agree to our{' '}
        <a href="#" className="text-[#6C63FF] hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-[#6C63FF] hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
