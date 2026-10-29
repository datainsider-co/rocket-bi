import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useWatch, type Control } from 'react-hook-form';
import { useDi } from '@/app/di/DiContext';
import type { JdbcSource } from '@/core/ingestion/DataSource';
import { DataSourceService } from '@/core/ingestion/DataSourceService';
import { SchemaService } from '@/core/schema/SchemaService';
import { databaseQueryOptions, databasesQueryOptions } from '@/shared/schema/schemaQueries';
import { toErrorMessage } from '@/shared/http/errorMessage';
import {
  sourceColumnsQueryOptions,
  sourceDatabasesQueryOptions,
  sourceOptionsQueryOptions,
  sourceTablesQueryOptions
} from '../ingestionQueries';
import { cleanTableNames, isListed, pickableSources, type JobFormValues } from './jobForm.utils';

/** Names to suggest for a field, which can also be typed (v1 `DropdownInput`). */
export interface Suggestions {
  readonly names: readonly string[];
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

export interface JobFormOptions {
  readonly sources: { readonly items: readonly JdbcSource[]; readonly isLoading: boolean; readonly error: string | undefined };
  readonly databases: Suggestions;
  readonly tables: Suggestions;
  readonly columns: Suggestions;
  /** Warehouse databases; a name not listed is created by the job's first sync (checked on the local stack, DI6). */
  readonly destDatabases: Suggestions;
  readonly destTables: Suggestions;
}

const NONE: readonly string[] = [];

function suggestions(query: UseQueryResult<readonly string[]>): Suggestions {
  return {
    names: query.data ?? NONE,
    isLoading: query.isFetching,
    error: query.isError ? toErrorMessage(query.error) : undefined
  };
}

/**
 * Suggestions of the job form, per field: v1's global `DataSourceModule.databaseNames/tableNames` became one query per
 * `[source, database]`. Tables load for a database the source listed, columns for a single listed table.
 */
export function useJobFormOptions(control: Control<JobFormValues>, ownSource: JdbcSource | undefined): JobFormOptions {
  const service = useDi(DataSourceService);
  const schemaService = useDi(SchemaService);
  const [sourceId, databaseName, tableNames, destDatabaseName] = useWatch({
    control,
    name: ['sourceId', 'databaseName', 'tableNames', 'destDatabaseName']
  });
  const tables = cleanTableNames(tableNames);
  const tableName = tables.length === 1 ? (tables[0] ?? '') : '';
  const id = sourceId ?? -1;

  const sources = useQuery(sourceOptionsQueryOptions(service));
  const databases = useQuery({ ...sourceDatabasesQueryOptions(service, id), enabled: sourceId !== null });
  const hasDatabase = sourceId !== null && isListed(databaseName, databases.data);
  const sourceTables = useQuery({ ...sourceTablesQueryOptions(service, id, databaseName), enabled: hasDatabase });
  const columns = useQuery({
    ...sourceColumnsQueryOptions(service, id, databaseName, tableName),
    enabled: hasDatabase && isListed(tableName, sourceTables.data)
  });
  const destDatabases = useQuery({
    ...databasesQueryOptions(schemaService),
    select: infos => infos.map(info => info.name)
  });
  const destTables = useQuery({
    ...databaseQueryOptions(schemaService, destDatabaseName),
    select: database => database.tables.map(table => table.name),
    enabled: isListed(destDatabaseName, destDatabases.data)
  });

  return {
    sources: {
      items: pickableSources(sources.data, ownSource),
      isLoading: sources.isFetching,
      error: sources.isError ? toErrorMessage(sources.error) : undefined
    },
    databases: suggestions(databases),
    tables: suggestions(sourceTables),
    columns: suggestions(columns),
    destDatabases: suggestions(destDatabases),
    destTables: suggestions(destTables)
  };
}
