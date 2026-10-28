import { useMemo } from 'react';
import { Table, type TableProps } from 'antd';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { JsonTableResponse } from '@/core/query/VisualizationResponse';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { collapseRowClassName, shownRowIndexes, toTreeRows } from './collapseTable.utils';
import type { DecorateColumn } from './columnDecorations';
import { CollapseToggle } from './CollapseToggle';
import { TABLE_COMPONENTS } from './tableComponents';
import type { TableLook } from './tableStyle.utils';
import { TableTooltipContext } from './TableTooltipContext';
import { toColumns, toRows, toTableSort, type CellNumberFormat, type TableRow } from './table.utils';
import './FlattenTable.css';

/** A collapse table's expanded rows (`useRowExpansion`). */
export interface RowCollapse {
  expandedKeys: readonly string[];
  onToggle: (key: string) => void;
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
  /** Rows that expand into their groups, for a collapse table. */
  collapse?: RowCollapse;
}

const stripeOf = (_row: TableRow, index: number) => (index % 2 === 0 ? 'flatten-table__row--even' : 'flatten-table__row--odd');

/** antd's tree rows driven by the collapse table's expanded keys, with v1's toggle and 12px per level. */
function expandableOf(collapse: RowCollapse): TableProps<TableRow>['expandable'] {
  return {
    expandedRowKeys: [...collapse.expandedKeys],
    onExpand: (_expanded, row) => collapse.onToggle(row.key),
    indentSize: 12,
    expandIcon: ({ expanded, expandable, record, onExpand }) => <CollapseToggle expanded={expanded} expandable={expandable} onToggle={event => onExpand(record, event)} />
  };
}

/**
 * Tables (v1 `DefaultTable`): title, rows of the current page with v1's number format, the row count, server-side
 * pages and sorting on one column, styled by the table's options, each column by its own formatting, each cell with
 * its full text on hover. A collapse table's rows expand into their groups.
 */
export function FlattenTableView({ title, subtitle, response, paging, loading, onPageChange, sort, onSortChange, numberFormat, look, decorate, collapse }: FlattenTableViewProps) {
  const columns = useMemo(() => toColumns(response.headers, sort, numberFormat, decorate), [response.headers, sort, numberFormat, decorate]);
  const tree = collapse !== undefined;
  const rows = useMemo(() => (tree ? toTreeRows : toRows)(response.records, paging.from), [tree, response.records, paging.from]);
  const expandedKeys = collapse?.expandedKeys;
  const rowClassName = useMemo(() => {
    if (!expandedKeys) return stripeOf;
    const shown = shownRowIndexes(rows, expandedKeys);
    return (row: TableRow) => collapseRowClassName(row.key, shown, expandedKeys);
  }, [rows, expandedKeys]);

  return (
    <div className="flatten-table flex h-full flex-col" style={look.vars}>
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
            pagination={{
              size: 'small',
              current: Math.floor(paging.from / paging.size) + 1,
              pageSize: paging.size,
              total: response.total,
              showSizeChanger: false,
              showTotal: total => `${total} rows`,
              onChange: (page, size) => onPageChange({ from: (page - 1) * size, size })
            }}
            onChange={(_pagination, _filters, sorter, { action }) => action === 'sort' && onSortChange(toTableSort(sorter))}
          />
        </TableTooltipContext>
      </div>
    </div>
  );
}
