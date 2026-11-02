import type { TableColumnsType } from 'antd';
import type { ColumnType } from 'antd/es/table/interface';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { EtlSortField, type EtlListing } from '@/core/data-cook/EtlService';
import type { Sort } from '@/core/listing/Listing';
import { columnSortOrder, formatDateTime } from '@/shared/listing/listing.utils';
import { EtlActionsCell } from './EtlActionsCell';
import { nextRunLabel } from './etlListing.utils';
import { EtlOwnerCell } from './EtlOwnerCell';
import { LastRunCell } from './LastRunCell';
import { TrashActionsCell } from './TrashActionsCell';
import type { EtlRowActions } from './useEtlListingPage';

/**
 * Columns of v1 `ListEtlJob`. A sortable column's `key` is its server sort field; v1 sorted Name and Created Time only,
 * Last Run and Next Run sort on their times here. The sort cycle never clears: a click flips the order.
 */
export function etlColumns(listing: EtlListing, sort: Sort<EtlSortField>, actions: EtlRowActions): TableColumnsType<EtlJob> {
  const sortable = (field: EtlSortField): ColumnType<EtlJob> => ({
    key: field,
    sorter: true,
    sortOrder: columnSortOrder(sort, field),
    sortDirections: ['ascend', 'descend', 'ascend']
  });

  return [
    {
      ...sortable(EtlSortField.Name),
      title: 'Name',
      render: (_, etl) => (
        <span className="flex items-center gap-2 font-medium">
          <i className="di-icon-etl text-lg" />
          {etl.displayName || '--'}
        </span>
      )
    },
    { key: 'owner', title: 'Owner', render: (_, etl) => <EtlOwnerCell etl={etl} /> },
    {
      ...sortable(EtlSortField.CreatedTime),
      title: 'Created Time',
      className: 'whitespace-nowrap',
      render: (_, etl) => formatDateTime(etl.createdTime)
    },
    { ...sortable(EtlSortField.LastExecuteTime), title: 'Last Run', render: (_, etl) => <LastRunCell etl={etl} /> },
    {
      ...sortable(EtlSortField.NextExecuteTime),
      title: 'Next Run',
      className: 'whitespace-nowrap',
      render: (_, etl) => nextRunLabel(etl, listing)
    },
    {
      key: 'action',
      title: 'Action',
      fixed: 'right',
      render: (_, etl) =>
        listing === 'trash' ? <TrashActionsCell etl={etl} actions={actions} /> : <EtlActionsCell etl={etl} actions={actions} />
    }
  ];
}
