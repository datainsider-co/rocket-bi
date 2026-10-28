import { Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { SourceInfo, SourceSortField } from '@/core/ingestion/DataSourceService';
import { columnSortOrder, formatDateTime, type ListingState } from '../listing/listing.utils';
import { SourceActionsCell, type SourceRowActions } from './SourceActionsCell';
import { SourceOwnerCell } from './SourceOwnerCell';
import { SOURCE_ACTION_COLUMN, sortFieldOfColumn, SourceColumn, sourceTypeLabel } from './sources.utils';

/** Headers flip between ascending and descending; the order shown is the one the server sorted by. */
const SORT_DIRECTIONS: ('ascend' | 'descend')[] = ['ascend', 'descend', 'ascend'];

function sortable(state: ListingState<SourceSortField>, column: SourceColumn) {
  const field = sortFieldOfColumn(column);
  return field === undefined
    ? {}
    : { sorter: true, sortOrder: columnSortOrder(state.sort, field), sortDirections: SORT_DIRECTIONS };
}

/**
 * v1 `DataSourceScreen` columns: Name, Owner (from `md`), Type, Last Modified (from `sm`), Action. The checkbox column
 * is the table's row selection.
 */
export function sourceColumns(state: ListingState<SourceSortField>, actions: SourceRowActions): TableColumnsType<SourceInfo> {
  return [
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
    },
    {
      key: SOURCE_ACTION_COLUMN,
      title: 'Action',
      width: 110,
      render: (_, { source }) => <SourceActionsCell source={source} actions={actions} />
    }
  ];
}
