import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { EtlService } from '@/core/data-cook/EtlService';
import type { JsonObject } from '@/core/json/json';
import { SchemaService } from '@/core/schema/SchemaService';
import type { TreeTable } from '@/shared/database-tree/databaseTree.utils';
import { databasesQueryOptions } from '@/shared/schema/schemaQueries';

/** What a new source is made of: the server's JSON of the table, and its database's display name. */
export interface LoadedSource {
  readonly json: JsonObject;
  readonly dbDisplayName: string;
}

/** Reads a warehouse table for a new source (Add Source, and Join with a warehouse table). */
export function useLoadSource(): (table: TreeTable) => Promise<LoadedSource> {
  const service = useDi(EtlService);
  const schema = useDi(SchemaService);
  const queryClient = useQueryClient();
  return useCallback(
    async (table: TreeTable) => {
      const [json, databases] = await Promise.all([service.getSourceTable(table.dbName, table.name), queryClient.fetchQuery(databasesQueryOptions(schema))]);
      const dbDisplayName = databases.find(database => database.name === table.dbName)?.displayName || table.dbName;
      return { json, dbDisplayName };
    },
    [service, schema, queryClient]
  );
}
