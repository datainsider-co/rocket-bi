import { useCallback, useState } from 'react';
import { useLocation } from 'react-router';
import type { NewTableName } from './schema-edit/schemaEdit.utils';

export interface TableDraft {
  /** The table being created, shown instead of its database. */
  readonly table: NewTableName | undefined;
  readonly start: (table: NewTableName) => void;
  readonly stop: () => void;
}

/**
 * The table named in New table, whose columns are being given (v1 `ViewMode.CreateTable`). It belongs to the page it
 * was started on: any navigation (another table in the tree, past the leave confirm) ends it.
 */
export function useTableDraft(): TableDraft {
  const { key } = useLocation();
  const [draft, setDraft] = useState<{ table: NewTableName; at: string }>();
  const start = useCallback((table: NewTableName) => setDraft({ table, at: key }), [key]);
  const stop = useCallback(() => setDraft(undefined), []);
  return { table: draft?.at === key ? draft.table : undefined, start, stop };
}
