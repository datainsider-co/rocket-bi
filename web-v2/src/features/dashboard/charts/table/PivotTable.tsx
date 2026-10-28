import { useMemo } from 'react';
import type { JsonObject } from '@/core/json/json';
import type { VizOptions } from '@/core/query/vizOptions';
import type { SubRowQuery } from '../../chart-data/useSubRowQuery';
import { sortByColumnName, sortByLabel } from './collapseTable.utils';
import { FlattenTableView, type FlattenTableViewProps } from './FlattenTableView';
import { isPivotPaged, leafHeaders, pivotSortable, pivotSortColumns, pivotTotals } from './pivotTable.utils';
import { tableCellText } from './table.utils';
import { usePivotRows } from './usePivotRows';

interface PivotTableProps extends Omit<FlattenTableViewProps, 'collapse' | 'sortable' | 'totals' | 'paged' | 'wide'> {
  /** The chart's setting, with every row group. */
  setting: JsonObject;
  options: VizOptions;
  /** How a row loads the rows under it, when the rows expand by queries of their own. */
  subRows?: SubRowQuery;
}

/**
 * The pivot table (v1 `PivotTable`): column groups across, row groups expanding into the next, a total row, sorted by
 * the row group (and by a value without columns across).
 */
export function PivotTable({ setting, options, subRows, sort, onSortChange, ...table }: PivotTableProps) {
  const { response, numberFormat, decorate } = table;
  const { collapse, loading } = usePivotRows(response, setting, table.paging.from, subRows);
  const sortColumns = useMemo(() => pivotSortColumns(setting), [setting]);
  const sortable = useMemo(() => pivotSortable(setting), [setting]);
  const labels = useMemo(() => leafHeaders(response.headers).map(header => header.label), [response.headers]);
  const shownSort = useMemo(() => sortByLabel(sort, sortColumns, labels), [sort, sortColumns, labels]);
  const totals = useMemo(
    () => pivotTotals(setting, options, response.headers, (header, value) => tableCellText(value, header, decorate?.(header).format ?? numberFormat)),
    [setting, options, response.headers, decorate, numberFormat]
  );
  return (
    <FlattenTableView
      {...table}
      loading={table.loading || loading}
      sort={shownSort}
      onSortChange={next => onSortChange(sortByColumnName(next, sortColumns))}
      collapse={collapse}
      sortable={sortable}
      totals={totals}
      paged={isPivotPaged(setting)}
      wide
    />
  );
}
