import type { ReactNode } from 'react';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Directory } from '@/core/directory/Directory';
import { SortOrder } from '@/core/directory/DirectoryService';
import { formatDateTime } from '../../directory.utils';
import { DirectoryNameCell } from './cells/DirectoryNameCell';
import { EmptyListing } from './EmptyListing';
import { OwnerCell } from './cells/OwnerCell';
import { bodyScrollHeight } from './table.utils';
import { useElementHeight } from './useElementHeight';

interface DirectoryTableProps {
  items: readonly Directory[];
  isLoading: boolean;
  /** Only Name sorts, on the server (v1 turned the other columns off). */
  nameOrder: SortOrder;
  onToggleNameSort: () => void;
  /** Missing when rows can't be opened (Trash). */
  onOpen: ((directory: Directory) => void) | undefined;
  renderActions: (directory: Directory) => ReactNode;
}

/**
 * v1's caret right after the label: down for A→Z, up for Z→A (`TableHeaderRenderEngine.renderSortElement`).
 * antd's ascend/descend arrows are replaced.
 */
function renderSortCaret({ sortOrder }: { sortOrder: 'ascend' | 'descend' | null }) {
  return <i className={`fas ${sortOrder === 'descend' ? 'fa-caret-up' : 'fa-caret-down'} ml-2`} />;
}

/**
 * v1 header cells (`CustomTable` `thead th`): 48px high, 12px bold, label and sort caret side by side. Colors and
 * padding come from `DirectoryTableTheme`.
 */
const HEADER_CLASSES = [
  '[&_.ant-table-thead>tr>th]:h-12',
  '[&_.ant-table-thead>tr>th]:py-0',
  '[&_.ant-table-thead>tr>th]:text-xs',
  '[&_.ant-table-thead>tr>th]:font-bold',
  '[&_.ant-table-thead>tr>th]:tracking-[0.2px]',
  '[&_.ant-table-column-sorters]:justify-start',
  '[&_.ant-table-column-title]:flex-none'
].join(' ');

/**
 * v1 `MyData.vue` table: Name, Owner, Last Modified, Action. Owner hides below `sm`, the rest below `md`. It fills the
 * height it is given: the header stays and the rows scroll. With no rows the empty state takes its place, as in v1.
 */
export function DirectoryTable({ items, isLoading, nameOrder, onToggleNameSort, onOpen, renderActions }: DirectoryTableProps) {
  const { ref: boxRef, height: boxHeight } = useElementHeight<HTMLDivElement>();
  const scrollY = bodyScrollHeight(boxHeight);

  if (!isLoading && items.length === 0) return <EmptyListing />;

  const columns: TableColumnsType<Directory> = [
    {
      key: 'name',
      title: 'Name',
      sorter: true,
      sortOrder: nameOrder === SortOrder.Asc ? 'ascend' : 'descend',
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortIcon: renderSortCaret,
      render: (_, directory) => <DirectoryNameCell directory={directory} />
    },
    {
      key: 'owner',
      title: 'Owner',
      responsive: ['sm'],
      render: (_, { owner }) => <OwnerCell owner={owner} />
    },
    {
      key: 'updatedDate',
      title: 'Last Modified',
      responsive: ['md'],
      className: 'whitespace-nowrap',
      render: (_, directory) => formatDateTime(directory.updatedDate)
    },
    { key: 'action', title: 'Action', width: 120, responsive: ['md'], render: (_, directory) => renderActions(directory) }
  ];

  return (
    <div ref={boxRef} className="min-h-0 flex-1 overflow-hidden rounded bg-[color:var(--directory-panel-bg,transparent)]">
      <Table<Directory>
        className={HEADER_CLASSES}
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={false}
        scroll={scrollY === undefined ? undefined : { y: scrollY }}
        showSorterTooltip={false}
        locale={{ emptyText: ' ' }}
        onChange={(_pagination, _filters, _sorter, { action }) => {
          if (action === 'sort') onToggleNameSort();
        }}
        onRow={directory => ({
          onClick: onOpen ? () => onOpen(directory) : undefined,
          className: onOpen ? 'cursor-pointer' : undefined
        })}
      />
    </div>
  );
}
