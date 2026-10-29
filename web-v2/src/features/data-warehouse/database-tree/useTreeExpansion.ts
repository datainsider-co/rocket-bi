import { useCallback, useState } from 'react';
import { toggleKey } from './databaseTree.utils';

export interface TreeExpansion {
  readonly openDatabases: ReadonlySet<string>;
  readonly openTables: ReadonlySet<string>;
  readonly toggleDatabase: (name: string) => void;
  readonly toggleTable: (key: string) => void;
}

/**
 * Which databases and tables are open. The database the page has selected opens with it (v1 opened the database of
 * the URL), and can then be closed like any other.
 */
export function useTreeExpansion(selectedDatabase: string | undefined): TreeExpansion {
  const [openDatabases, setOpenDatabases] = useState<ReadonlySet<string>>(() => new Set(selectedDatabase ? [selectedDatabase] : []));
  const [openTables, setOpenTables] = useState<ReadonlySet<string>>(() => new Set());
  const [shownSelection, setShownSelection] = useState(selectedDatabase);

  if (selectedDatabase !== shownSelection) {
    setShownSelection(selectedDatabase);
    if (selectedDatabase && !openDatabases.has(selectedDatabase)) setOpenDatabases(new Set([...openDatabases, selectedDatabase]));
  }

  const toggleDatabase = useCallback((name: string) => setOpenDatabases(keys => toggleKey(keys, name)), []);
  const toggleTable = useCallback((key: string) => setOpenTables(keys => toggleKey(keys, key)), []);
  return { openDatabases, openTables, toggleDatabase, toggleTable };
}
