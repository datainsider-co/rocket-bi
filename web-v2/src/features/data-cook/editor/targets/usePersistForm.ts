import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { PersistConfiguration } from '@/core/data-cook/EtlOperator';
import { SchemaService } from '@/core/schema/SchemaService';
import { databaseQueryOptions, databasesQueryOptions } from '@/shared/schema/schemaQueries';
import { checkPersist, persistFormOf, persistHint, resolvedName, type PersistForm } from './persist.utils';

const NONE: readonly string[] = [];

/**
 * The Save To Data Warehouse form: a database and a table of the warehouse, picked or typed new, and the write type.
 * The tables offered are those of the database picked, when it exists.
 */
export function usePersistForm(initial: PersistConfiguration | undefined, onSubmit: (persist: PersistConfiguration) => void) {
  const service = useDi(SchemaService);
  const [form, setForm] = useState<PersistForm>(() => persistFormOf(initial));
  const [errors, setErrors] = useState<{ database?: string | undefined; table?: string | undefined }>({});
  const databases = useQuery(databasesQueryOptions(service));
  const databaseNames = useMemo(() => databases.data?.map(database => database.name) ?? NONE, [databases.data]);
  const dbName = resolvedName(form.database, databaseNames);
  const exists = databaseNames.includes(dbName);
  const schema = useQuery({ ...databaseQueryOptions(service, dbName), enabled: exists });
  const tableNames = useMemo(() => (exists ? (schema.data?.tables.map(table => table.name) ?? NONE) : NONE), [exists, schema.data]);

  const change = (next: Partial<PersistForm>) => {
    setForm(current => ({ ...current, ...next }));
    setErrors({});
  };
  return {
    form,
    errors,
    databaseOptions: (databases.data ?? []).map(database => ({ value: database.name, label: database.displayName || database.name })),
    tableOptions: tableNames.map(name => ({ value: name, label: name })),
    loadingTables: exists && schema.isPending,
    hint: persistHint(form, databaseNames, tableNames),
    setDatabase: (database: string) => change({ database }),
    setTable: (table: string) => change({ table }),
    setType: (type: PersistForm['type']) => change({ type }),
    submit: () => {
      const checked = checkPersist(form, databaseNames, tableNames);
      if (checked.ok) onSubmit(checked.persist);
      else setErrors({ database: checked.databaseError, table: checked.tableError });
    }
  };
}

export type PersistFormModel = ReturnType<typeof usePersistForm>;
