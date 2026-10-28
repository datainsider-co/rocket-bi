import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { SchemaEditService } from '@/core/schema/SchemaEditService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { queryLanguage } from './completions.utils';
import { ALL_FUNCTIONS, functionsOf } from './functionCatalog.utils';
import { UpdateTableQueryDialogView } from './UpdateTableQueryDialogView';
import { updateViewQuery, type ViewQueryUpdate } from './updateViewQuery';
import { useFunctionCatalog } from './useFunctionCatalog';

interface UpdateTableQueryDialogProps {
  table: TableSchema;
  /** The database's tables, suggested in the editor. */
  tables: readonly TableSchema[];
  onSaved: (update: ViewQueryUpdate) => void;
  onCancel: () => void;
}

/** Replaces a view's query. Mount it per opening so it starts from the view's query. */
export function UpdateTableQueryDialog({ table, tables, onSaved, onCancel }: UpdateTableQueryDialogProps) {
  const edit = useDi(SchemaEditService);
  const [query, setQuery] = useState(table.query ?? '');
  const catalog = useFunctionCatalog('sql');
  const language = useMemo(() => catalog && queryLanguage(table.dbName, tables, functionsOf(catalog, ALL_FUNCTIONS)), [catalog, table.dbName, tables]);
  const mutation = useMutation({ mutationFn: () => updateViewQuery(edit, table, query), onSuccess: onSaved });
  return (
    <UpdateTableQueryDialogView
      table={table}
      query={{ value: query, onChange: setQuery }}
      language={language}
      saving={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={() => mutation.mutate()}
      onCancel={onCancel}
    />
  );
}
