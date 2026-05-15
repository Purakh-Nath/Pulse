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
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  },
  published: {
    label: 'Published',
    className: 'bg-[#6C63FF]/10 text-[#6C63FF]',
  },
  active: {
    label: 'Active',
    className: 'bg-[#3DDC97]/10 text-[#3DDC97]',
  },
  expired: {
    label: 'Expired',
    className: 'bg-[#FF5A5F]/10 text-[#FF5A5F]',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
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
          <h3 className="font-heading text-base font-semibold text-[#111] dark:text-white truncate mb-1 group-hover:text-[#6C63FF] transition-colors">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-sm text-[#5E5E5E] dark:text-gray-400 line-clamp-2">
              {poll.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {poll.status === 'active' && <LiveBadge />}
          {poll.publishResults && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#3DDC97]/10 text-[#3DDC97]">
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
      <div className="flex items-center gap-4 text-xs text-[#5E5E5E] dark:text-gray-400 mb-4">
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
            className="flex items-center gap-1.5 text-xs text-[#6C63FF] hover:underline font-medium"
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
              className="flex items-center gap-1.5 text-xs text-[#5E5E5E] hover:text-[#111] dark:hover:text-white font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Share
            </button>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#6C63FF] transition-colors" />
      </div>
    </motion.div>
  );
}
