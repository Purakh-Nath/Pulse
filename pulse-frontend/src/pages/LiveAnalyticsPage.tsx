
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Activity,
  ArrowLeft,
  Share2,
  ExternalLink,
  Settings,
  BarChart3,
  X,
  Copy,
  Check,
  Globe,
  Send,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { usePoll } from '@/hooks/usePoll';
import { usePollAnalytics } from '@/hooks/usePollAnalytics';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { useAuthStore } from '@/stores/authStore';
import { analyticsService } from '@/api/analytics';
import { pollsService } from '@/api/polls';
import { queryKeys } from '@/config/queryKeys';
import { Button } from '@/components/ui/Button';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { AnalyticsSkeleton } from '@/components/ui/Skeleton';
import { ANALYTICS_DELAY_MS, APP_URL, CHART_COLORS } from '@/config/constants';
import toast from 'react-hot-toast';

export default function LiveAnalyticsPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: poll, isLoading: pollLoading } = usePoll(slug ?? '');
  const { data: analytics, isLoading: analyticsLoading } = usePollAnalytics(
    slug ?? ''
  );

  const [publishing, setPublishing] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Hook up sockets for realtime presence and response counts
  useSocketRoom({ pollId: poll?.id ?? '' });
  const { activeUsers, responseCount, isExpired } = useRealtimeAnalytics({
    pollId: poll?.id ?? '',
  });

  const isLoading = pollLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (!poll || !analytics) {
    return <div>Poll not found.</div>;
  }

  // Ownership guard
  if (user && poll.ownerId && poll.ownerId !== user.id) {
    return <Navigate to="/dashboard" replace />;
  }

  // Derive published state: use local override after publishing, else poll flag
  const pollIsPublished = isPublished ?? poll.publishResults;
  const resultsUrl = `${APP_URL}/results/${poll.slug}`;

  // Socket counts overwrite initial fetched counts if they exist
  const displayTotalResponses =
    responseCount > 0 ? responseCount : analytics.totalResponses;
  const displayActiveUsers =
    activeUsers > 0 ? activeUsers : analytics.activeUsers;

  const handleShare = () => {
    const url = `${APP_URL}/poll/${poll.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Poll link copied to clipboard!');
  };

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      await analyticsService.publishResults(poll.id);
      setIsPublished(true);
      setShowPublishedModal(true);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics(poll.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.results(poll.slug) });
        queryClient.invalidateQueries({ queryKey: ['poll'] });
      }, ANALYTICS_DELAY_MS);
    } catch {
      toast.error('Failed to publish results. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleActivate = async () => {
    if (activating) return;
    setActivating(true);
    try {
      await pollsService.activatePoll(poll.id);
      toast.success('Poll published successfully!');
      queryClient.invalidateQueries({ queryKey: ['poll'] });
    } catch {
      toast.error('Failed to publish poll. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  const handleCopyResultsLink = () => {
    navigator.clipboard.writeText(resultsUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-heading dark:text-text-dark hover:text-text-dark-h transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-3xl font-bold text-text-heading dark:text-text-dark-h">
              {poll.title}
            </h1>
            {poll.status === 'active' && !isExpired && (
              <LiveBadge variant="purple" />
            )}
            {poll.status === 'draft' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/5 text-text-muted dark:text-text-dark">
                Draft
              </span>
            )}
            {isExpired && <LiveBadge variant="red" label="EXPIRED" />}
            {pollIsPublished && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                <Globe className="w-3 h-3" />
                Results Published
              </span>
            )}
          </div>
          <p className="text-text-muted dark:text-text-dark max-w-2xl text-sm">
            {poll.description || 'No description provided.'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {poll.status === 'draft' ? (
            <Button
              onClick={handleActivate}
              loading={activating}
              icon={<Send className="w-4 h-4" />}
            >
              Publish Poll
            </Button>
          ) : (
            <>
              {pollIsPublished ? (
                <Button
                  variant="secondary"
                  icon={<Globe className="w-4 h-4" />}
                  onClick={() => setShowPublishedModal(true)}
                >
                  View Results Link
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  icon={<BarChart3 className="w-4 h-4" />}
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? 'Publishing…' : 'Publish Results'}
                </Button>
              )}
              <Button variant="secondary" icon={<Settings className="w-4 h-4" />}>
                Settings
              </Button>
              <Button
                onClick={handleShare}
                icon={<Share2 className="w-4 h-4" />}
                variant="outline"
              >
                Share Link
              </Button>
              <Button
                onClick={() => window.open(`/poll/${poll.slug}`, '_blank')}
                icon={<ExternalLink className="w-4 h-4" />}
              >
                View Live
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted dark:text-text-dark mb-2">
            <Activity className="w-4 h-4 text-accent" />
            Total Responses
          </div>
          <div className="font-heading text-4xl font-bold text-text-heading dark:text-text-dark-h">
            <AnimatedCounter value={displayTotalResponses} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted dark:text-text-dark mb-2">
            <Users className="w-4 h-4 text-success" />
            Active Viewers
          </div>
          <div className="font-heading text-4xl font-bold text-text-heading dark:text-text-dark-h flex items-center gap-3">
            <AnimatedCounter value={displayActiveUsers} />
            {displayActiveUsers > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted dark:text-text-dark mb-2">
            <svg
              className="w-4 h-4 text-warning"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            Completion Rate
          </div>
          <div className="font-heading text-4xl font-bold text-text-heading dark:text-text-dark-h">
            <AnimatedCounter value={analytics.completionRate} suffix="%" />
          </div>
        </motion.div>
      </div>

      {/* Question Results */}
      <div className="space-y-6">
        {analytics.questions.map((q, i) => (
          <motion.div
            key={q.questionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            className="card p-6 md:p-8"
          >
            <h3 className="font-heading text-xl font-semibold text-text-heading dark:text-text-dark-h mb-6">
              {q.questionText}
              <span className="ml-3 text-sm font-normal text-text-muted">
                {q.totalAnswers} answers
              </span>
            </h3>

            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={q.options}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="optionText"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#444', fontSize: 14 }}
                    width={150}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      padding: '12px 16px',
                    }}
                    formatter={(value: unknown) => [
                      `${value} votes`,
                      'Responses',
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {q.options.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Published Results Modal */}
      <AnimatePresence>
        {showPublishedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowPublishedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="card p-8 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPublishedModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-5">
                <Globe className="w-7 h-7 text-success" />
              </div>

              <h2 className="font-heading text-2xl font-bold text-text-heading dark:text-text-dark-h mb-2">
                Results Published! 🎉
              </h2>
              <p className="text-sm text-text-muted dark:text-text-dark mb-6">
                Your poll results are now publicly accessible. Share the link below
                with anyone - no login required to view them.
              </p>

              {/* Link box */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-bg-2 dark:bg-bg-dark-2 border border-border dark:border-border-dark mb-4">
                <span className="flex-1 text-sm text-text-heading dark:text-text-dark-h font-mono truncate">
                  {resultsUrl}
                </span>
                <button
                  onClick={handleCopyResultsLink}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-muted dark:text-text-dark"
                  title="Copy link"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCopyResultsLink}
                  icon={linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  className="flex-1"
                >
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  variant="outline"
                  icon={<ExternalLink className="w-4 h-4" />}
                  onClick={() => window.open(resultsUrl, '_blank')}
                  className="flex-1"
                >
                  Open Results
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
