import { queryOptions } from '@tanstack/react-query';
import type { DatabaseService } from '@/core/schema/DatabaseService';

/** Queries of the Data Warehouse pages; the schemas themselves are `shared/schema/schemaQueries`. */
export const warehouseKeys = {
  all: ['warehouse'] as const,
  databases: ['warehouse', 'databases'] as const
};

export function databaseEntriesQueryOptions(service: DatabaseService) {
  return queryOptions({
    queryKey: warehouseKeys.databases,
    queryFn: ({ signal }) => service.listMyData(signal)
  });
}
