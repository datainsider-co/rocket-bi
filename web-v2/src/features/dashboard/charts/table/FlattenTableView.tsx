import { useCallback, useMemo } from 'react';
import { Table, type TablePaginationConfig, type TableProps } from 'antd';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { JsonTableResponse } from '@/core/query/VisualizationResponse';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { collapseRowClassName, shownRowIndexes } from './collapseTable.utils';
import type { DecorateColumn } from './columnDecorations';
import { CollapseToggle } from './CollapseToggle';
import { TABLE_COMPONENTS } from './tableComponents';
import type { TableLook } from './tableStyle.utils';
import { TableTooltipContext } from './TableTooltipContext';
import { TableTotalRow, type TableTotals } from './TableTotalRow';
import { toColumns, toRows, toTableSort, type CellNumberFormat, type SortableHeader, type TableRow } from './table.utils';
import './FlattenTable.css';

/** A collapse or pivot table's rows with their groups below them, and the ones expanded (`useRowExpansion`). */
export interface RowCollapse {
  rows: readonly TableRow[];
  expandedKeys: readonly string[];
  onToggle: (row: TableRow) => void;
}

export interface FlattenTableViewProps {
  title?: string;
  subtitle?: string;
  response: JsonTableResponse;
  paging: Paging;
  loading: boolean;
  onPageChange: (paging: Paging) => void;
  sort?: TableSort;
  onSortChange: (sort: TableSort | undefined) => void;
  numberFormat: CellNumberFormat;
  /** The table's colors, fonts, grid and tooltip from its options. */
  look: TableLook;
  /** Each column's own formatting (`columnDecorationsOf`). */
  decorate?: DecorateColumn;
  /** Rows that expand into their groups, for a collapse or pivot table. */
  collapse?: RowCollapse;
  /** The headers that sort the table; every one by default. */
  sortable?: SortableHeader;
  /** A pivot table's total row. */
  totals?: TableTotals;
  /** False for a table of one row, which has no pages. */
  paged?: boolean;
  /** Columns as wide as their content, scrolling across (a pivot table's many columns), instead of fitting the card. */
  wide?: boolean;
}

const WIDE = { x: 'max-content' } as const;

const stripeOf = (_row: TableRow, index: number) => (index % 2 === 0 ? 'flatten-table__row--even' : 'flatten-table__row--odd');

/** antd's tree rows driven by the collapse table's expanded keys, with v1's toggle and 12px per level. */
function expandableOf(collapse: RowCollapse): TableProps<TableRow>['expandable'] {
  return {
    expandedRowKeys: [...collapse.expandedKeys],
    onExpand: (_expanded, row) => collapse.onToggle(row),
    indentSize: 12,
    expandIcon: ({ expanded, expandable, record, onExpand }) => <CollapseToggle expanded={expanded} expandable={expandable} onToggle={event => onExpand(record, event)} />
  };
}

/** v1's footer: the row count and the server's pages. */
function paginationOf(paging: Paging, total: number, onPageChange: (paging: Paging) => void): TablePaginationConfig {
  return {
    size: 'small',
    current: Math.floor(paging.from / paging.size) + 1,
    pageSize: paging.size,
    total,
    showSizeChanger: false,
    showTotal: count => `${count} rows`,
    onChange: (page, size) => onPageChange({ from: (page - 1) * size, size })
  };
}

/**
 * Tables (v1 `DefaultTable`, `PivotTable`): title, rows of the current page with v1's number format, the row count,
 * server-side pages and sorting on one column, styled by the table's options, each column by its own formatting, each
 * cell with its full text on hover. A collapse or pivot table's rows expand into their groups; a pivot table has a
 * total row.
 */
export function FlattenTableView(props: FlattenTableViewProps) {
  const { title, subtitle, response, paging, loading, onPageChange, sort, onSortChange, numberFormat, look, decorate, collapse, sortable, totals, paged = true, wide = false } = props;
  const columns = useMemo(() => toColumns(response.headers, sort, numberFormat, decorate, sortable), [response.headers, sort, numberFormat, decorate, sortable]);
  const flatRows = useMemo(() => toRows(response.records, paging.from), [response.records, paging.from]);
  const rows = collapse?.rows ?? flatRows;
  const expandedKeys = collapse?.expandedKeys;
  const renderTotals = useCallback(() => totals && <TableTotalRow totals={totals} />, [totals]);
  const rowClassName = useMemo(() => {
    if (!expandedKeys) return stripeOf;
    const shown = shownRowIndexes(rows, expandedKeys);
    return (row: TableRow) => collapseRowClassName(row.key, shown, expandedKeys);
  }, [rows, expandedKeys]);

  return (
    <div className={`flatten-table flex h-full flex-col ${totals ? 'flatten-table--totals' : ''}`} style={look.vars}>
      {(title || subtitle) && (
        <div className="flatten-table__header">
          {title && (
            <div className="flatten-table__title" style={look.title}>
              {title}
            </div>
          )}
          {subtitle && (
            <div className="flatten-table__subtitle" style={look.subtitle}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      <div className={`flatten-table__body ${GRID_NO_DRAG_CLASS}`}>
        <TableTooltipContext value={look.tooltip}>
          <Table<TableRow>
            size="small"
            components={TABLE_COMPONENTS}
            rowClassName={rowClassName}
            columns={columns}
            dataSource={rows}
            loading={loading}
            expandable={collapse && expandableOf(collapse)}
            scroll={wide ? WIDE : undefined}
            summary={totals ? renderTotals : undefined}
            pagination={paged && paginationOf(paging, response.total, onPageChange)}
            onChange={(_pagination, _filters, sorter, { action }) => action === 'sort' && onSortChange(toTableSort(sorter))}
          />
        </TableTooltipContext>
      </div>
    </div>
  );
}
