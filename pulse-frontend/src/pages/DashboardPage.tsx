import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Filter } from 'lucide-react';
import { useInfinitePolls } from '@/hooks/useInfinitePolls';
import { PollCard } from '@/components/shared/PollCard';
import { Button } from '@/components/ui/Button';
import { PollCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfinitePolls({ status: statusFilter || undefined });

  // Intersection Observer for infinite scrolling
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (status === 'pending' || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [status, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const polls = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading dark:text-text-dark-h mb-1">
            Dashboard
          </h1>
          <p className="text-text-muted dark:text-text-dark">
            Welcome back, {user?.name?.split(' ')[0]}. Here are your polls.
          </p>
        </div>
        <Link to="/dashboard/new">
          <Button icon={<PlusCircle className="w-4 h-4" />}>Create Poll</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar">
          {['All', 'Active', 'Draft', 'Closed', 'Expired'].map((filter) => {
            const val = filter === 'All' ? '' : filter.toLowerCase();
            const isActive = statusFilter === val;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(val)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-text-heading dark:bg-text-dark-h text-bg dark:text-bg-dark'
                    : 'bg-bg-2 dark:bg-bg-dark-2 text-text-muted dark:text-text-dark border border-border dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {status === 'pending' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PollCardSkeleton key={i} />
          ))}
        </div>
      ) : status === 'error' ? (
        <EmptyState
          title="Failed to load polls"
          description="There was an error loading your dashboard. Please try again."
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      ) : polls.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-12 h-12" />}
          title="No polls found"
          description={
            statusFilter
              ? `You don't have any ${statusFilter} polls.`
              : "You haven't created any polls yet. Start by creating your first poll."
          }
          action={
            !statusFilter ? (
              <Link to="/dashboard/new">
                <Button icon={<PlusCircle className="w-4 h-4" />}>
                  Create Poll
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={() => setStatusFilter('')}>
                Clear Filter
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll, i) => {
            const isLast = i === polls.length - 1;
            return (
              <div key={poll.id} ref={isLast ? lastElementRef : undefined}>
                <PollCard poll={poll} index={i % 12} />
              </div>
            );
          })}
          {isFetchingNextPage && (
            <>
              <PollCardSkeleton />
              <PollCardSkeleton />
              <PollCardSkeleton />
            </>
          )}
        </div>
      )}
    </div>
  );
}
