import type { ReactElement } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { createContainer } from '@/core/di/Container';
import { DataSourceService } from '@/core/ingestion/DataSourceService';
import { JobHistoryService } from '@/core/ingestion/JobHistoryService';
import { JobService } from '@/core/ingestion/JobService';
import { fakeDataSourceService, fakeJobHistoryService, fakeJobService } from './testing';

interface IngestionServices {
  sources?: DataSourceService;
  jobs?: JobService;
  history?: JobHistoryService;
}

/**
 * Test-only: renders an ingestion page at `path` with the app providers and fake services. The real routes sit behind
 * `VITE_ENABLE_INGESTION`, which is off in tests, so pages are rendered on their own.
 */
export function renderIngestionPage(page: ReactElement, path: string, services: IngestionServices = {}) {
  const sources = services.sources ?? fakeDataSourceService();
  const jobs = services.jobs ?? fakeJobService();
  const history = services.history ?? fakeJobHistoryService();
  const container = createContainer([
    di => {
      di.bindValue(DataSourceService, sources);
      di.bindValue(JobService, jobs);
      di.bindValue(JobHistoryService, history);
    }
  ]);
  const router = createMemoryRouter([{ path: '*', element: page }], { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <AppProviders queryClient={queryClient} container={container}>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return { ...result, router, queryClient, sources, jobs, history };
}
