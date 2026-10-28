import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import type { JsonObject } from '@/core/json/json';
import { SchemaService, type TableSchema } from '@/core/schema/SchemaService';
import { databaseQueryOptions, databasesQueryOptions } from '@/shared/schema/schemaQueries';
import {
  fieldRefsOf,
  initialExpanded,
  mainDatabaseOf,
  opened,
  searchControls,
  searchTableNodes,
  tableNodesOf,
  tablesIn,
  toggled,
  type DatabaseSelect,
  type TreeTables
} from './fieldTree.utils';

export interface FieldTreeInput {
  /**
   * Settings whose fields pick the database and tables to open (v1 `selectDatabaseAndTable`): the edited chart's, or
   * every chart of the dashboard for a new one.
   */
  readonly usedSettings: readonly JsonObject[];
  /** An ad hoc chart's table (v1 `AdhocBuilderConfig`): shown alone, without the database select. */
  readonly adhocTable?: TableSchema;
  readonly controls?: readonly ChartControl[];
}

/** The field tree's data and UI state (v1 `DatabaseListing` + `BuilderTableSchemaStore`): the view's props, and its tables. */
export function useFieldTree({ usedSettings, adhocTable, controls }: FieldTreeInput) {
  const service = useDi(SchemaService);
  const refs = useMemo(() => usedSettings.flatMap(fieldRefsOf), [usedSettings]);
  const databases = useQuery({ ...databasesQueryOptions(service), enabled: !adhocTable });
  const [picked, setPicked] = useState<string>();
  const dbName = picked ?? mainDatabaseOf(refs) ?? databases.data?.[0]?.name ?? '';
  const schema = useQuery({ ...databaseQueryOptions(service, dbName), enabled: !adhocTable && dbName !== '' });
  const nodes = useMemo(() => tableNodesOf(adhocTable ? [adhocTable] : (schema.data?.tables ?? [])), [adhocTable, schema.data]);

  const [keyword, setKeyword] = useState('');
  const [expandedByDb, setExpandedByDb] = useState<Readonly<Record<string, ReadonlySet<string>>>>({});
  // A database the user picks opens on its first table, the chart's own on the tables it uses.
  const defaultExpanded = useMemo(() => initialExpanded(nodes, picked === undefined ? tablesIn(refs, dbName) : []), [nodes, picked, refs, dbName]);
  const expanded = expandedByDb[dbName] ?? defaultExpanded;
  const searching = keyword.trim() !== '';
  const shown = useMemo(() => searchTableNodes(nodes, keyword), [nodes, keyword]);

  const onToggle = useCallback((key: string) => setExpandedByDb(current => ({ ...current, [dbName]: toggled(current[dbName] ?? defaultExpanded, key) })), [dbName, defaultExpanded]);
  const expand = useCallback((key: string) => setExpandedByDb(current => ({ ...current, [dbName]: opened(current[dbName] ?? defaultExpanded, key) })), [dbName, defaultExpanded]);
  const onSelectDatabase = useCallback((name: string) => {
    setPicked(name);
    setKeyword('');
  }, []);

  const failed = adhocTable ? false : databases.isError || schema.isError;
  const loading = adhocTable ? false : databases.isPending || (dbName !== '' && schema.isPending);
  const tableState: TreeTables = {
    nodes: shown,
    // A search opens every table it finds, as in v1.
    expanded: searching ? new Set(shown.map(node => node.key)) : expanded,
    onToggle,
    status: failed ? 'error' : loading ? 'loading' : 'ready',
    error: databases.isError ? 'Cannot load the databases' : `Loading the ${dbName} database has failed`
  };
  const databaseSelect: DatabaseSelect | undefined = adhocTable ? undefined : { options: databases.data ?? [], value: dbName || undefined, onChange: onSelectDatabase };
  return {
    view: {
      databases: databaseSelect,
      search: { keyword, onChange: setKeyword },
      tables: tableState,
      controls: controls && searchControls(controls, keyword)
    },
    /** Every table of the database, whatever the search, for picking a field from a menu. */
    nodes,
    /** The schemas behind `nodes`, none for an ad hoc table. */
    tables: adhocTable ? undefined : schema.data?.tables,
    /** Opens a table of the shown database. */
    expand
  };
}
