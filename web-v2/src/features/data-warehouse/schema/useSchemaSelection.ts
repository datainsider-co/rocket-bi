import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { SchemaService } from '@/core/schema/SchemaService';
import { databasesQueryOptions } from '@/shared/schema/schemaQueries';
import { selectionFromParams, selectionToParams, type SchemaSelection } from './schema.utils';

export interface SchemaSelectionState {
  readonly selection: SchemaSelection;
  /** The database list is still loading, so the default database is not known yet. */
  readonly isLoading: boolean;
  readonly select: (next: SchemaSelection) => void;
}

/** What the Schema page shows, kept in the URL like v1 (`?database=&table=`, replaced rather than pushed). */
export function useSchemaSelection(): SchemaSelectionState {
  const databases = useQuery(databasesQueryOptions(useDi(SchemaService)));
  const [params, setParams] = useSearchParams();
  const selection = useMemo(() => selectionFromParams(params, databases.data ?? []), [params, databases.data]);
  const select = useCallback((next: SchemaSelection) => setParams(selectionToParams(next), { replace: true }), [setParams]);
  return { selection, isLoading: databases.isPending, select };
}
