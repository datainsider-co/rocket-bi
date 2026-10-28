import { Table } from 'antd';
import type { TableProps } from 'antd';
import type { SourceId } from '@/core/ingestion/DataSource';
import type { SourceInfo, SourceSortField } from '@/core/ingestion/DataSourceService';
import { listingPagination } from '../listing/listing.utils';
import type { SourceRowActions } from './SourceActionsCell';
import { sourceColumns } from './sourceColumns';
import { isEditableSource, sortFieldOfColumn, sourceRowKey, type DataSourcesListing } from './sources.utils';

export interface SourceSelection {
  readonly selectedIds: readonly SourceId[];
  readonly onChange: (ids: SourceId[]) => void;
}

interface DataSourcesTableProps {
  listing: Pick<DataSourcesListing, 'rows' | 'total' | 'state' | 'isFetching'>;
  selection: SourceSelection;
  actions: SourceRowActions;
  onPageChange: (page: number, pageSize: number) => void;
  onSortOn: (field: SourceSortField) => void;
}

/**
 * v1 `DataSourceScreen` table, paged and sorted on the server, with checkboxes for the bulk Delete. Clicking a row of
 * a JDBC source starts a job on it.
 */
export function DataSourcesTable({ listing, selection, actions, onPageChange, onSortOn }: DataSourcesTableProps) {
  const { rows, total, state, isFetching } = listing;

  const handleChange: TableProps<SourceInfo>['onChange'] = (_pagination, _filters, sorter, { action }) => {
    if (action !== 'sort') return;
    const field = sortFieldOfColumn((Array.isArray(sorter) ? sorter[0] : sorter)?.columnKey);
    if (field !== undefined) onSortOn(field);
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <Table<SourceInfo>
        rowKey={sourceRowKey}
        columns={sourceColumns(state, actions)}
        dataSource={rows}
        loading={isFetching}
        showSorterTooltip={false}
        locale={{ emptyText: ' ' }}
        rowSelection={{
          selectedRowKeys: [...selection.selectedIds],
          onChange: keys => selection.onChange(keys.map(Number))
        }}
        onRow={({ source }) =>
          isEditableSource(source)
            ? { onClick: () => actions.onCreateJob(source), className: 'cursor-pointer', title: 'Create a job from this source' }
            : {}
        }
        onChange={handleChange}
        pagination={{ ...listingPagination(state.page, state.pageSize, total), onChange: onPageChange }}
      />
    </div>
  );
}
