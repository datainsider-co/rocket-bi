import { useMemo } from 'react';
import { Table } from 'antd';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import type { JsonTableResponse } from '@/core/query/VisualizationResponse';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { TABLE_COMPONENTS } from './tableComponents';
import type { TableLook } from './tableStyle.utils';
import { TableTooltipContext } from './TableTooltipContext';
import { toColumns, toRows, toTableSort, type CellNumberFormat, type TableRow } from './table.utils';
import './FlattenTable.css';

interface FlattenTableViewProps {
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
}

/**
 * Tables (v1 `DefaultTable`): title, rows of the current page with v1's number format, the row count, server-side
 * pages and sorting on one column, styled by the table's options, each cell with its full text on hover. Per-field
 * formatting and conditional colors come later.
 */
export function FlattenTableView({ title, subtitle, response, paging, loading, onPageChange, sort, onSortChange, numberFormat, look }: FlattenTableViewProps) {
  const columns = useMemo(() => toColumns(response.headers, sort, numberFormat), [response.headers, sort, numberFormat]);
  const rows = useMemo(() => toRows(response.records, paging.from), [response.records, paging.from]);

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
            rowClassName={(_row, index) => (index % 2 === 0 ? 'flatten-table__row--even' : 'flatten-table__row--odd')}
            columns={columns}
            dataSource={rows}
            loading={loading}
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
