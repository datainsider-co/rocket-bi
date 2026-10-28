import { useMemo } from 'react';
import { sortByColumnName, sortByLabel, toTreeRows } from './collapseTable.utils';
import { FlattenTableView, type FlattenTableViewProps } from './FlattenTableView';
import { useRowExpansion } from './useRowExpansion';

interface CollapseTableProps extends Omit<FlattenTableViewProps, 'collapse'> {
  /** The query's columns, which name the headers' sorts. */
  columns: readonly unknown[];
}

/**
 * The collapse table (v1 `DefaultTable` on a group table): the table with expandable rows, sorted by the column a
 * header shows rather than by its label.
 */
export function CollapseTable({ columns, sort, onSortChange, ...table }: CollapseTableProps) {
  const { expandedKeys, onToggle } = useRowExpansion(table.response.records);
  const { headers, records } = table.response;
  const rows = useMemo(() => toTreeRows(records, table.paging.from), [records, table.paging.from]);
  const collapse = useMemo(() => ({ rows, expandedKeys, onToggle }), [rows, expandedKeys, onToggle]);
  const shownSort = useMemo(() => sortByLabel(sort, columns, headers.map(header => header.label)), [sort, columns, headers]);
  return <FlattenTableView {...table} sort={shownSort} onSortChange={next => onSortChange(sortByColumnName(next, columns))} collapse={collapse} />;
}
