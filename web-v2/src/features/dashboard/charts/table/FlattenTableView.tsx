import { useMemo } from 'react';
import { Table } from 'antd';
import type { Paging } from '@/core/query/QueryRequest';
import type { JsonTableResponse } from '@/core/query/VisualizationResponse';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { toColumns, toRows, type TableRow } from './table.utils';

interface FlattenTableViewProps {
  title?: string;
  subtitle?: string;
  response: JsonTableResponse;
  paging: Paging;
  loading: boolean;
  onPageChange: (paging: Paging) => void;
}

/**
 * Tables (v1 `DefaultTable`): title, rows of the current page, server-side pages. Field formatting, conditional
 * colors, totals and sorting come later (MIGRATION.md, dashboard M4).
 */
export function FlattenTableView({ title, subtitle, response, paging, loading, onPageChange }: FlattenTableViewProps) {
  const columns = useMemo(() => toColumns(response.headers), [response.headers]);
  const rows = useMemo(() => toRows(response.records, paging.from), [response.records, paging.from]);

  return (
    <div className="flex h-full flex-col">
      {title && (
        <div className="truncate text-center" style={{ fontFamily: 'var(--widget-primary-font-family)', fontSize: 'var(--widget-primary-font-size)', fontWeight: 'var(--widget-primary-font-weight)' }}>
          {title}
        </div>
      )}
      {subtitle && (
        <div className="truncate text-center" style={{ color: 'var(--secondary-text-color)', fontSize: 'var(--widget-secondary-font-size)' }}>
          {subtitle}
        </div>
      )}
      <div className={`mt-2 min-h-0 flex-1 overflow-auto ${GRID_NO_DRAG_CLASS}`}>
        <Table<TableRow>
          size="small"
                    columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={{
            size: 'small',
            current: Math.floor(paging.from / paging.size) + 1,
            pageSize: paging.size,
            total: response.total,
            showSizeChanger: false,
            onChange: (page, size) => onPageChange({ from: (page - 1) * size, size })
          }}
        />
      </div>
    </div>
  );
}
