import { useMemo } from 'react';
import { sortByColumnName, sortByLabel } from './collapseTable.utils';
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
  const collapse = useRowExpansion(table.response.records);
  const { headers } = table.response;
  const shownSort = useMemo(() => sortByLabel(sort, columns, headers.map(header => header.label)), [sort, columns, headers]);
  return (
    <FlattenTableView
      {...table}
      sort={shownSort}
      onSortChange={next => onSortChange(sortByColumnName(next, columns))}
      collapse={collapse}
    />
  );
}
