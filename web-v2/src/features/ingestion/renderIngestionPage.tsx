import type { ReactElement } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { createContainer } from '@/core/di/Container';
import { CsvImportService } from '@/core/ingestion/CsvImportService';
import { DataSourceService } from '@/core/ingestion/DataSourceService';
import { JobHistoryService } from '@/core/ingestion/JobHistoryService';
import { JobService } from '@/core/ingestion/JobService';
import { SchemaService } from '@/core/schema/SchemaService';
import {
  fakeCsvImportService,
  fakeDataSourceService,
  fakeJobHistoryService,
  fakeJobService,
  fakeSchemaService
} from './testing';

interface IngestionServices {
  sources?: DataSourceService;
  jobs?: JobService;
  history?: JobHistoryService;
  schema?: SchemaService;
  csv?: CsvImportService;
}

/**
 * Test-only: renders an ingestion page at `path` with the app providers and fake services. The real routes sit behind
 * `VITE_ENABLE_INGESTION`, which is off in tests, so pages are rendered on their own.
 */
export function renderIngestionPage(page: ReactElement, path: string, services: IngestionServices = {}) {
  const sources = services.sources ?? fakeDataSourceService();
  const jobs = services.jobs ?? fakeJobService();
  const history = services.history ?? fakeJobHistoryService();
  const schema = services.schema ?? fakeSchemaService();
  const csv = services.csv ?? fakeCsvImportService();
  const container = createContainer([
    di => {
      di.bindValue(DataSourceService, sources);
      di.bindValue(JobService, jobs);
      di.bindValue(JobHistoryService, history);
      di.bindValue(SchemaService, schema);
      di.bindValue(CsvImportService, csv);
    }
  ]);
  const router = createMemoryRouter([{ path: '*', element: page }], { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <AppProviders queryClient={queryClient} container={container}>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return { ...result, router, queryClient, sources, jobs, history, schema, csv };
}

/**
 * Test-only: the open dialog whose title is `title`. antd labels every dialog with the same `test-id` under test, so
 * `getByRole('dialog', { name })` can't tell them apart.
 */
export function findDialog(title: string): Promise<HTMLElement> {
  return waitFor(() => {
    const dialog = screen.getAllByRole('dialog').find(element => within(element).queryAllByText(title).length > 0);
    if (!dialog) throw new Error(`No dialog titled "${title}"`);
    return dialog;
  });
}
