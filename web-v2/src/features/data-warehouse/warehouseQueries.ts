import { queryOptions } from '@tanstack/react-query';
import type { JsonObject } from '@/core/json/json';
import type { QueryService } from '@/core/query/QueryService';
import type { DatabaseService } from '@/core/schema/DatabaseService';
import type { TableRef } from '@/core/schema/SchemaEditService';
import type { TableService } from '@/core/schema/TableService';
import { isProcessing } from './schema/schema.utils';

/** Queries of the Data Warehouse pages; the schemas themselves are `shared/schema/schemaQueries`. */
export const warehouseKeys = {
  all: ['warehouse'] as const,
  databases: ['warehouse', 'databases'] as const,
  table: ({ dbName, name }: TableRef) => ['warehouse', 'table', dbName, name] as const,
  preview: (request: JsonObject) => ['warehouse', 'preview', request] as const
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

/** One page of a table's rows (Table Data); the request is the key, so each page and sort is cached apart. */
export function tablePreviewQueryOptions(service: QueryService, request: JsonObject) {
  return queryOptions({
    queryKey: warehouseKeys.preview(request),
    queryFn: ({ signal }) => service.query(request, signal)
  });
}
