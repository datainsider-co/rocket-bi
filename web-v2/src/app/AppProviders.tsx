import type { ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { ThemeProvider } from '@/app/theme/ThemeContext';

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntApp>{children}</AntApp>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
