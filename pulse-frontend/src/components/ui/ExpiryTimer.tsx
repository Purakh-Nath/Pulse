import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { isExpired } from '@/lib/formatters';

interface ExpiryTimerProps {
  expiresAt: string;
  className?: string;
  onExpired?: () => void;
}

function getTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function ExpiryTimer({ expiresAt, className, onExpired }: ExpiryTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(expiresAt));
  const expired = isExpired(expiresAt);

  useEffect(() => {
    if (expired) {
      onExpired?.();
      return;
    }

    const interval = setInterval(() => {
      const t = getTimeLeft(expiresAt);
      setTimeLeft(t);
      if (t === 'Expired') {
        onExpired?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, expired, onExpired]);

  const isUrgent =
    !expired &&
    new Date(expiresAt).getTime() - Date.now() < 1000 * 60 * 5; // < 5 min

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        expired
          ? 'text-danger'
          : isUrgent
            ? 'text-warning animate-pulse'
            : 'text-text-muted dark:text-text-dark',
        className,
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      {timeLeft}
    </span>
  );
}
