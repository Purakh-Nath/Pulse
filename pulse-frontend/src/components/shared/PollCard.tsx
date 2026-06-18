import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatRelative, formatNumber } from '@/lib/formatters';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { ExpiryTimer } from '@/components/ui/ExpiryTimer';
import type { PollSummary } from '@/types/poll';

const statusConfig = {
  draft: {
    label: 'Draft',
    className: 'bg-black/5 dark:bg-white/5 text-text-muted dark:text-text-dark',
  },
  published: {
    label: 'Published',
    className: 'bg-accent-bg text-accent',
  },
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success',
  },
  expired: {
    label: 'Expired',
    className: 'bg-danger/10 text-danger',
  },
  closed: {
    label: 'Closed',
    className: 'bg-black/5 dark:bg-white/5 text-text-muted dark:text-text-dark',
  },
};

interface PollCardProps {
  poll: PollSummary;
  index?: number;
}

export function PollCard({ poll, index = 0 }: PollCardProps) {
  const navigate = useNavigate();
  const config = statusConfig[poll.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      className="card p-6 cursor-pointer group"
      onClick={() => navigate(`/dashboard/polls/${poll.slug}/analytics`)}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/dashboard/polls/${poll.slug}/analytics`);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-semibold text-text-heading dark:text-text-dark-h truncate mb-1 group-hover:text-accent transition-colors">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-sm text-text-muted dark:text-text-dark line-clamp-2">
              {poll.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {poll.status === 'active' && <LiveBadge />}
          {poll.publishResults && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
              <Globe className="w-3 h-3" />
              Published
            </span>
          )}
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              config.className,
            )}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-text-muted dark:text-text-dark mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {formatNumber(poll._count?.responses ?? 0)} responses
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatRelative(poll.createdAt)}
        </span>
        {poll.expiresAt && poll.status === 'active' && (
          <ExpiryTimer expiresAt={poll.expiresAt} />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/polls/${poll.slug}/analytics`);
            }}
            className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
          {poll.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/poll/${poll.slug}`, '_blank');
              }}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-heading dark:hover:text-text-dark-h font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Share
            </button>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted opacity-50 group-hover:opacity-100 group-hover:text-accent transition-all" />
      </div>
    </motion.div>
  );
}
