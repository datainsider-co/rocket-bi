import { Table, Typography } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';
import type { SourceInfo, SourceSortField } from '@/core/ingestion/DataSourceService';
import { columnSortOrder, formatDateTime, listingPagination, type ListingState } from '../listing/listing.utils';
import { SourceOwnerCell } from './SourceOwnerCell';
import { sortFieldOfColumn, SourceColumn, sourceRowKey, sourceTypeLabel } from './sources.utils';

interface DataSourcesTableProps {
  rows: readonly SourceInfo[];
  total: number;
  state: ListingState<SourceSortField>;
  isLoading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onSortOn: (field: SourceSortField) => void;
}

/** Headers flip between ascending and descending; the order shown is the one the server sorted by. */
const SORT_DIRECTIONS: ('ascend' | 'descend')[] = ['ascend', 'descend', 'ascend'];

function sortable(state: ListingState<SourceSortField>, column: SourceColumn) {
  const field = sortFieldOfColumn(column);
  return field === undefined
    ? {}
    : { sorter: true, sortOrder: columnSortOrder(state.sort, field), sortDirections: SORT_DIRECTIONS };
}

/**
 * v1 `DataSourceScreen` table: Name, Owner, Type, Last Modified, paged and sorted on the server. Owner shows from
 * `md`, Last Modified from `sm`. Rows are keyed by source id for the selection and row actions of DI3b.
 */
export function DataSourcesTable({ rows, total, state, isLoading, onPageChange, onSortOn }: DataSourcesTableProps) {
  const columns: TableColumnsType<SourceInfo> = [
    {
      key: SourceColumn.Name,
      title: 'Name',
      ellipsis: true,
      ...sortable(state, SourceColumn.Name),
      render: (_, { source }) => (
        <Typography.Text strong title={source.displayName}>
          {source.displayName}
        </Typography.Text>
      )
    },
    {
      key: SourceColumn.Owner,
      title: 'Owner',
      width: 200,
      responsive: ['md'],
      ...sortable(state, SourceColumn.Owner),
      render: (_, info) => <SourceOwnerCell info={info} />
    },
    {
      key: SourceColumn.Type,
      title: 'Type',
      width: 180,
      ellipsis: true,
      ...sortable(state, SourceColumn.Type),
      render: (_, { source }) => sourceTypeLabel(source)
    },
    {
      key: SourceColumn.LastModified,
      title: 'Last Modified',
      width: 200,
      responsive: ['sm'],
      className: 'whitespace-nowrap',
      ...sortable(state, SourceColumn.LastModified),
      render: (_, { source }) => formatDateTime(source.lastModify)
    }
  ];

  const handleChange: TableProps<SourceInfo>['onChange'] = (_pagination, _filters, sorter, { action }) => {
    if (action !== 'sort') return;
    const field = sortFieldOfColumn((Array.isArray(sorter) ? sorter[0] : sorter)?.columnKey);
    if (field !== undefined) onSortOn(field);
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <Table<SourceInfo>
        rowKey={sourceRowKey}
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        showSorterTooltip={false}
        locale={{ emptyText: ' ' }}
        onChange={handleChange}
        pagination={{ ...listingPagination(state.page, state.pageSize, total), onChange: onPageChange }}
      />
    </div>
  );
}
