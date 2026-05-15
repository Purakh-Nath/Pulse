import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, ArrowLeft, Users, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Cell,} from 'recharts';
import { analyticsService } from '@/api/analytics';
import { queryKeys } from '@/config/queryKeys';
import { formatDate, formatNumber } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CHART_COLORS } from '@/config/constants';
import { Button } from '@/components/ui/Button';

export default function ResultsPage() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.results(slug ?? ''),
    queryFn: () => analyticsService.getResults(slug ?? ''),
    enabled: !!slug,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto pt-12 pb-24 px-4 space-y-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-12" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="pt-20">
        <EmptyState
          icon={<BarChart3 className="w-12 h-12" />}
          title="Results not available"
          description="These results might be private, the poll may have been deleted, or the link is invalid."
          action={
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { poll, analytics, publishedAt } = data ?? {};
  if (!poll || !analytics) {
    return (
      <div className="pt-20">
        <EmptyState
          icon={<BarChart3 className="w-12 h-12" />}
          title="Results not available"
          description="These results might be private, the poll may have been deleted, or the link is invalid."
          action={
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isFinalResults = poll.status === 'expired' || poll.status === 'closed';
  const canDisplayResults = poll.publishResults || isFinalResults;

  if (!canDisplayResults) {
    return (
      <div className="pt-20">
        <EmptyState
          icon={<BarChart3 className="w-12 h-12" />}
          title="Results not available"
          description="These results might be private, the poll may have been deleted, or the link is invalid."
          action={
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pt-12 pb-24 px-4">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 mb-6">
          <BarChart3 className="w-3.5 h-3.5" />
          {isFinalResults ? 'Final Results' : 'Published Results'}
        </div>
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-[#111] dark:text-white mb-6 text-balance">
          {poll.title}
        </h1>
        {poll.description && (
          <p className="text-lg text-[#5E5E5E] dark:text-gray-400 max-w-2xl mx-auto text-balance mb-8">
            {poll.description}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#5E5E5E] dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {formatNumber(analytics.totalResponses)} total responses
          </span>
          {publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Published {formatDate(publishedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-8">
        {analytics.questions.map((q, i) => (
          <motion.div
            key={q.questionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="card p-6 md:p-10"
          >
            <h3 className="font-heading text-2xl font-semibold text-[#111] dark:text-white mb-8">
              {q.questionText}
            </h3>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={q.options}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
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
                    formatter={(value, _name, props) => [
                      `${value} votes (${props.payload.percentage}%)`,
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
      
      <div className="mt-16 text-center">
         <Link to="/">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Create your own poll
            </Button>
          </Link>
      </div>
    </div>
  );
}
