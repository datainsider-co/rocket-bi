import type { ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { ThemeProvider } from '@/app/theme/ThemeContext';
import { DiProvider } from '@/app/di/DiContext';
import type { DiResolver } from '@/core/di/Container';

interface AppProvidersProps {
  queryClient: QueryClient;
  container: DiResolver;
  children: ReactNode;
}

export function AppProviders({ queryClient, container, children }: AppProvidersProps) {
  return (
    <DiProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AntApp>{children}</AntApp>
        </ThemeProvider>
      </QueryClientProvider>
    </DiProvider>
  );
}
