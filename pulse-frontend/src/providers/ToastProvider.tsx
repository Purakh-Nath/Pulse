import { Toaster } from 'react-hot-toast';
import { type ReactNode } from 'react';
import { useTheme } from './ThemeProvider';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#1C1F28' : '#FFFFFF',
            color: isDark ? '#F5F5F5' : '#111111',
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(0,0,0,0.08)',
            borderRadius: '12px',
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.12)',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '380px',
          },
          success: {
            iconTheme: {
              primary: '#3DDC97',
              secondary: isDark ? '#1C1F28' : '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF5A5F',
              secondary: isDark ? '#1C1F28' : '#FFFFFF',
            },
          },
        }}
      />
    </>
  );
}
