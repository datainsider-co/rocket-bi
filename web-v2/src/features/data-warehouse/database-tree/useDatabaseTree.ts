import { useCallback, useState } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCreateDatabase, type CreateDatabaseDialog } from './useCreateDatabase';
import { useDatabaseTreeData, type DatabaseTreeData } from './useDatabaseTreeData';
import { useTreeExpansion, type TreeExpansion } from './useTreeExpansion';
import type { TreeHandlers, TreeSelection } from './databaseTree.utils';

/** v1's tree search waited 300 ms after the last key. */
const SEARCH_DEBOUNCE_MS = 300;

export interface TreeSearch {
  readonly isOpen: boolean;
  readonly text: string;
  readonly onToggle: () => void;
  readonly onChange: (text: string) => void;
}

export interface DatabaseTreeModel {
  readonly data: DatabaseTreeData;
  readonly expansion: TreeExpansion;
  readonly search: TreeSearch;
  readonly create: CreateDatabaseDialog;
  /** A database row was clicked: it opens or closes, and the page may show it. */
  readonly onDatabaseClick: (name: string) => void;
}

/** The tree's state: what is loaded, open and searched, and the Create Database dialog. */
export function useDatabaseTree(selection: TreeSelection, handlers: TreeHandlers): DatabaseTreeModel {
  const expansion = useTreeExpansion(selection.dbName);
  const [searchOpen, setSearchOpen] = useState(false);
  const [text, setText] = useState('');
  const keyword = useDebouncedValue(searchOpen ? text : '', SEARCH_DEBOUNCE_MS);
  const data = useDatabaseTreeData(expansion.openDatabases, keyword);
  const { onSelectDatabase } = handlers;
  const create = useCreateDatabase(database => onSelectDatabase?.(database.name));
  const { toggleDatabase } = expansion;

  const onToggle = useCallback(() => {
    setSearchOpen(open => !open);
    setText('');
  }, []);
  const onDatabaseClick = useCallback(
    (name: string) => {
      toggleDatabase(name);
      onSelectDatabase?.(name);
    },
    [toggleDatabase, onSelectDatabase]
  );

  return { data, expansion, search: { isOpen: searchOpen, text, onToggle, onChange: setText }, create, onDatabaseClick };
}
