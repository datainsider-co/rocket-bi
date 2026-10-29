import type { TreeHandlers, TreeSelection } from './databaseTree.utils';
import { DatabaseTreeView } from './DatabaseTreeView';
import { useDatabaseTree } from './useDatabaseTree';

interface DatabaseTreeProps {
  selection?: TreeSelection;
  handlers?: TreeHandlers;
}

const NO_SELECTION: TreeSelection = {};
const NO_HANDLERS: TreeHandlers = {};

/** The database tree, shared by the Schema, Query Editor and Relationship pages. */
export function DatabaseTree({ selection = NO_SELECTION, handlers = NO_HANDLERS }: DatabaseTreeProps) {
  const model = useDatabaseTree(selection, handlers);
  return <DatabaseTreeView model={model} selection={selection} handlers={handlers} />;
}
