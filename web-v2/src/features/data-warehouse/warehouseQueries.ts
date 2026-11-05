import { queryOptions } from '@tanstack/react-query';
import type { RlsPolicyService } from '@/core/rls/RlsPolicyService';
import type { DatabaseService } from '@/core/schema/DatabaseService';
import type { TableRef } from '@/core/schema/SchemaEditService';
import type { TableService } from '@/core/schema/TableService';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { isProcessing } from './schema/schema.utils';

/** Queries of the Data Warehouse pages; the schemas themselves are `shared/schema/schemaQueries`. */
export const warehouseKeys = {
  all: ['warehouse'] as const,
  databases: schemaKeys.entries,
  table: ({ dbName, name }: TableRef) => ['warehouse', 'table', dbName, name] as const,
  policies: ({ dbName, name }: TableRef) => ['warehouse', 'policies', dbName, name] as const
};

/** v1 polled a table the server was still filling every 30 s. */
const PROCESSING_POLL_MS = 30_000;

export function databaseEntriesQueryOptions(service: DatabaseService) {
  return queryOptions({
    queryKey: warehouseKeys.databases,
    queryFn: ({ signal }) => service.listMyData(signal)
  });
}

/** A table with what the Schema page edits; polled while the server fills it. */
export function tableDefinitionQueryOptions(service: TableService, table: TableRef) {
  return queryOptions({
    queryKey: warehouseKeys.table(table),
    queryFn: ({ signal }) => service.getTable(table, signal),
    refetchInterval: query => (query.state.data && isProcessing(query.state.data) ? PROCESSING_POLL_MS : false)
  });
}

/** A table's RLS policies (`policies/list`). */
export function rlsPoliciesQueryOptions(service: RlsPolicyService, table: TableRef) {
  return queryOptions({
    queryKey: warehouseKeys.policies(table),
    queryFn: ({ signal }) => service.list(table, signal)
  });
}
