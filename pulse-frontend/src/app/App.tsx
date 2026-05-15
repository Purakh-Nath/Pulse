import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { AppRoutes } from '@/routes';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { AuthBootstrap } from './AuthBootstrap';

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AuthBootstrap>
              <SocketProvider>
                <ToastProvider>
                  <AppRoutes />
                </ToastProvider>
              </SocketProvider>
            </AuthBootstrap>
          </ThemeProvider>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
}
