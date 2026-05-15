import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PollBuilderPage = lazy(() => import('@/pages/PollBuilderPage'));
const PublicPollPage = lazy(() => import('@/pages/PublicPollPage'));
const DemoPage = lazy(() => import('@/pages/DemoPage'));
const LiveAnalyticsPage = lazy(() => import('@/pages/LiveAnalyticsPage'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-3 w-64">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes (redirect to dashboard if logged in) */}
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Route>

        {/* Public poll pages */}
        <Route element={<PublicLayout />}>
          <Route path="/poll/demo" element={<DemoPage />} />
          <Route path="/poll/:slug" element={<PublicPollPage />} />
          <Route path="/results/:slug" element={<ResultsPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/new" element={<PollBuilderPage />} />
            <Route path="/dashboard/polls/:pollId/edit" element={<PollBuilderPage />} />
            <Route path="/dashboard/polls/:slug/analytics" element={<LiveAnalyticsPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
