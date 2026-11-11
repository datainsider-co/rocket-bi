import './FieldTree.css';

interface FieldTreeEmptyViewProps {
  /** What the list holds: tables and columns, or the dashboard's chart controls. */
  listing: 'database' | 'control';
  /** Nothing matches the search, rather than nothing to list. */
  searching: boolean;
}

/** v1 `DatabaseListing`'s empty states: "No found ..." for a search, `EmptyDirectory` otherwise. */
export function FieldTreeEmptyView({ listing, searching }: FieldTreeEmptyViewProps) {
  const found = listing === 'database' ? 'No found tables & columns' : 'No found tab controls';
  const empty = listing === 'database' ? 'Database empty' : 'Chart control empty';
  return (
    <div className={`field-tree__empty${searching ? '' : ' field-tree__empty--directory'}`}>
      <img src="/icons/directory-empty.svg" alt="" />
      <div>{searching ? found : empty}</div>
    </div>
  );
}
