import { DeleteOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { DatabaseEntry } from '@/core/schema/DatabaseService';
import { UserAvatar } from '@/shared/user/UserAvatar';
import { compareDatabases, formatCreatedTime, ownerName } from './databases.utils';

export interface DatabaseRowActions {
  readonly onDelete: (entry: DatabaseEntry) => void;
}

/** v1 `DatabaseListing` columns: Name, Owner (from `md`), Created Time (from `sm`), Action. Sorted in the browser. */
export function databaseColumns(actions: DatabaseRowActions): TableColumnsType<DatabaseEntry> {
  return [
    {
      key: 'name',
      title: 'Name',
      ellipsis: true,
      sorter: compareDatabases.name,
      defaultSortOrder: 'ascend',
      render: (_, entry) => (
        <span className="flex min-w-0 items-center gap-2" title={entry.name}>
          <i className="di-icon-database shrink-0 text-black/60" aria-hidden />
          <Typography.Text strong ellipsis>
            {entry.displayName}
          </Typography.Text>
        </span>
      )
    },
    {
      key: 'owner',
      title: 'Owner',
      width: 220,
      responsive: ['md'],
      sorter: compareDatabases.owner,
      render: (_, entry) => {
        const name = ownerName(entry);
        return (
          <span className="flex min-w-0 items-center" title={name}>
            <UserAvatar size={24} name={name} avatar={entry.owner?.avatar} className="mr-2" />
            <span className="truncate">{name}</span>
          </span>
        );
      }
    },
    {
      key: 'createdTime',
      title: 'Created Time',
      width: 200,
      responsive: ['sm'],
      className: 'whitespace-nowrap',
      sorter: compareDatabases.createdTime,
      render: (_, entry) => formatCreatedTime(entry.createdTime)
    },
    {
      key: 'action',
      title: 'Action',
      width: 90,
      render: (_, entry) => (
        <Tooltip title="Delete">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete ${entry.displayName}`}
            onClick={event => {
              // The row opens the database; the button must not.
              event.stopPropagation();
              actions.onDelete(entry);
            }}
          />
        </Tooltip>
      )
    }
  ];
}
