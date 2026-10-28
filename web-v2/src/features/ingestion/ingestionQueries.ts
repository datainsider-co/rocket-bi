import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { SourceId } from '@/core/ingestion/DataSource';
import { SourceSortField, type DataSourceService } from '@/core/ingestion/DataSourceService';
import type { JobStatus } from '@/core/ingestion/Job';
import type { JobHistoryService, JobHistorySortField } from '@/core/ingestion/JobHistoryService';
import type { JobService, JobSortField } from '@/core/ingestion/JobService';
import { SortOrder, type ListingRequest } from '@/core/listing/Listing';

/**
 * Query keys of Data Ingestion. A change to a source can change the jobs listing (it shows the source) and a sync adds
 * history, so mutations invalidate `ingestionKeys.all`.
 */
export const ingestionKeys = {
  all: ['ingestion'] as const,
  sources: (request: ListingRequest<SourceSortField>) => ['ingestion', 'sources', request] as const,
  jobs: (request: ListingRequest<JobSortField>, statuses: readonly JobStatus[] | undefined) =>
    ['ingestion', 'jobs', request, statuses ?? null] as const,
  history: (request: ListingRequest<JobHistorySortField>) => ['ingestion', 'history', request] as const,
  sourceOptions: ['ingestion', 'source-options'] as const,
  databases: (sourceId: SourceId) => ['ingestion', 'source', sourceId, 'databases'] as const,
  tables: (sourceId: SourceId, databaseName: string) => ['ingestion', 'source', sourceId, 'tables', databaseName] as const,
  columns: (sourceId: SourceId, databaseName: string, tableName: string) =>
    ['ingestion', 'source', sourceId, 'columns', databaseName, tableName] as const
};

/** Listings keep the previous page on screen while the next one loads. */
export function sourcesQueryOptions(service: DataSourceService, request: ListingRequest<SourceSortField>) {
  return queryOptions({
    queryKey: ingestionKeys.sources(request),
    queryFn: ({ signal }) => service.list(request, signal),
    placeholderData: keepPreviousData
  });
}

export function jobsQueryOptions(
  service: JobService,
  request: ListingRequest<JobSortField>,
  statuses?: readonly JobStatus[]
) {
  return queryOptions({
    queryKey: ingestionKeys.jobs(request, statuses),
    queryFn: ({ signal }) => service.list(request, statuses, signal),
    placeholderData: keepPreviousData
  });
}

export function historyQueryOptions(service: JobHistoryService, request: ListingRequest<JobHistorySortField>) {
  return queryOptions({
    queryKey: ingestionKeys.history(request),
    queryFn: ({ signal }) => service.list(request, signal),
    placeholderData: keepPreviousData
  });
}

/** The job form's source picker lists every source at once (v1 loaded them the same way), by name. */
const SOURCE_OPTIONS_SIZE = 1000;

export function sourceOptionsQueryOptions(service: DataSourceService) {
  return queryOptions({
    queryKey: ingestionKeys.sourceOptions,
    queryFn: async ({ signal }) => {
      const request = { from: 0, size: SOURCE_OPTIONS_SIZE, sorts: [{ field: SourceSortField.Name, order: SortOrder.Asc }] };
      return (await service.list(request, signal)).data.map(info => info.source);
    }
  });
}

/** What a source holds, for the job form's suggestions. The server asks the source itself, so it can fail or be slow. */
export function sourceDatabasesQueryOptions(service: DataSourceService, sourceId: SourceId) {
  return queryOptions({
    queryKey: ingestionKeys.databases(sourceId),
    queryFn: ({ signal }) => service.listDatabases(sourceId, signal),
    retry: false
  });
}

export function sourceTablesQueryOptions(service: DataSourceService, sourceId: SourceId, databaseName: string) {
  return queryOptions({
    queryKey: ingestionKeys.tables(sourceId, databaseName),
    queryFn: ({ signal }) => service.listTables(sourceId, databaseName, signal),
    retry: false
  });
}

export function sourceColumnsQueryOptions(service: DataSourceService, sourceId: SourceId, databaseName: string, tableName: string) {
  return queryOptions({
    queryKey: ingestionKeys.columns(sourceId, databaseName, tableName),
    queryFn: ({ signal }) => service.listColumns(sourceId, databaseName, tableName, signal),
    retry: false
  });
}
