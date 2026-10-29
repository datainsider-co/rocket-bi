import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { useDi } from '@/app/di/DiContext';
import type { CsvColumn } from '@/core/ingestion/CsvImport';
import { CsvImportService, type CsvTableRef } from '@/core/ingestion/CsvImportService';
import { SchemaService } from '@/core/schema/SchemaService';
import { databaseQueryOptions, databasesQueryOptions } from '@/shared/schema/schemaQueries';
import { toErrorMessage } from '@/shared/http/errorMessage';
import type { Suggestions } from '../job-form/useJobFormOptions';
import {
  csvDestinationSchema,
  destinationErrors,
  destinationHint,
  EMPTY_DESTINATION,
  resolveDestination,
  type CsvDestinationValues
} from './csvDestination.utils';

const NONE: readonly string[] = [];

function suggestions(names: readonly string[] | undefined, isLoading: boolean, error: unknown): Suggestions {
  return { names: names ?? NONE, isLoading, error: error ? toErrorMessage(error) : undefined };
}

/**
 * v1 `DescribeDatabase`: a warehouse database and table, listed or typed. Import resolves them against fresh lists
 * (the suggestions may still be loading), checks an existing table's columns, creates a new table and hands the table
 * to `onReady`. An existing table is not sent to `ingestion/csv/schema`, which would rewrite its display name.
 */
export function useCsvDestination(columns: readonly CsvColumn[], onReady: (target: CsvTableRef) => void) {
  const schemaService = useDi(SchemaService);
  const csvService = useDi(CsvImportService);
  const queryClient = useQueryClient();
  const form = useForm<CsvDestinationValues>({ resolver: zodResolver(csvDestinationSchema), defaultValues: EMPTY_DESTINATION });
  const values = useWatch({ control: form.control }) as CsvDestinationValues;

  const databases = useQuery({ ...databasesQueryOptions(schemaService), select: infos => infos.map(info => info.name) });
  const listed = resolveDestination(values, databases.data ?? NONE, []);
  const database = useQuery({
    ...databaseQueryOptions(schemaService, listed.dbName),
    enabled: !listed.isNewDatabase
  });
  const destination = resolveDestination(values, databases.data ?? NONE, database.data?.tables ?? []);

  const save = useMutation({
    mutationFn: async (submitted: CsvDestinationValues): Promise<CsvTableRef | undefined> => {
      const names = (await queryClient.fetchQuery(databasesQueryOptions(schemaService))).map(info => info.name);
      const found = resolveDestination(submitted, names, []);
      const tables = found.isNewDatabase ? [] : (await queryClient.fetchQuery(databaseQueryOptions(schemaService, found.dbName))).tables;
      const resolved = resolveDestination(submitted, names, tables);
      const errors = destinationErrors(resolved, columns);
      if (Object.keys(errors).length > 0) {
        for (const [field, message] of Object.entries(errors)) form.setError(field as keyof CsvDestinationValues, { message });
        return undefined;
      }
      const { table } = resolved;
      const name =
        table.kind === 'existing'
          ? table.name
          : await csvService.createTable({ dbName: resolved.dbName, name: table.name, displayName: table.displayName, columns });
      return { dbName: resolved.dbName, name };
    },
    onSuccess: target => {
      if (target) onReady(target);
    }
  });

  return {
    form,
    suggestions: {
      databases: suggestions(databases.data, databases.isFetching, databases.error),
      tables: suggestions(database.data?.tables.map(table => table.name), database.isFetching, database.error)
    },
    hints: {
      databaseName: values.databaseName.trim() ? destinationHint(destination, 'databaseName') : undefined,
      tableName: values.tableName.trim() ? destinationHint(destination, 'tableName') : undefined
    },
    submit: form.handleSubmit(submitted => save.mutate(submitted)),
    isPending: save.isPending,
    errorMessage: save.isError ? toErrorMessage(save.error) : undefined
  };
}

export type CsvDestinationForm = ReturnType<typeof useCsvDestination>;
