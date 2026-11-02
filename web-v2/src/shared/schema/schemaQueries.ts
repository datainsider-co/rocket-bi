import { queryOptions } from '@tanstack/react-query';
import type { SchemaService } from '@/core/schema/SchemaService';

/** Schemas change only when someone edits a database, so a few minutes old is fine (v1 loaded them once). */
const SCHEMA_STALE_MS = 5 * 60_000;

export const schemaKeys = {
  /** Every schema query, to refresh them all. */
  all: ['schema'] as const,
  databases: ['schema', 'databases'] as const,
  /** The user's databases with their owners and sharing (the Data Warehouse listing). */
  entries: ['schema', 'entries'] as const,
  /** Every database's query, to read the ones loaded so far. */
  anyDatabase: ['schema', 'database'] as const,
  database: (dbName: string) => ['schema', 'database', dbName] as const
};

export function databasesQueryOptions(service: SchemaService) {
  return queryOptions({
    queryKey: schemaKeys.databases,
    queryFn: ({ signal }) => service.listDatabases(signal),
    staleTime: SCHEMA_STALE_MS
  });
}

export function databaseQueryOptions(service: SchemaService, dbName: string) {
  return queryOptions({
    queryKey: schemaKeys.database(dbName),
    queryFn: ({ signal }) => service.getDatabase(dbName, signal),
    staleTime: SCHEMA_STALE_MS
  });
}
