import { Button } from 'antd';
import type { Connection } from '@/core/connection/Connection';
import { PageHeader } from '@/shared/layout/PageHeader';
import { connectorIconUrl } from '../setup/select/connectorOptions';

interface DataSourceConfigHeaderProps {
  /** The saved connection; its actions show only when there is one. */
  connection: Connection | undefined;
  isRefreshing: boolean;
  isUpdatingSchema: boolean;
  onUpdateSchema: () => void;
  onRefresh: () => void;
}

/** v1 `ConnectorConfig` header: "DataSource", the connection's icon and name, Update Schema and Refresh. */
export function DataSourceConfigHeader({
  connection,
  isRefreshing,
  isUpdatingSchema,
  onUpdateSchema,
  onRefresh
}: DataSourceConfigHeaderProps) {
  const iconUrl = connection && connectorIconUrl(connection.className);

  return (
    <PageHeader
      icon="di-icon-my-data"
      title="DataSource"
      trail={
        connection && (
          <span className="flex items-center gap-2 text-base">
            {iconUrl && <img src={iconUrl} alt="" width={24} height={24} />}
            <span className="truncate">{connection.displayName}</span>
          </span>
        )
      }
      actions={
        connection && (
          <>
            <Button icon={<i className="di-icon-sync" />} loading={isUpdatingSchema} onClick={onUpdateSchema}>
              Update Schema
            </Button>
            <Button icon={<i className="di-icon-reset" />} loading={isRefreshing} onClick={onRefresh}>
              Refresh
            </Button>
          </>
        )
      }
    />
  );
}
