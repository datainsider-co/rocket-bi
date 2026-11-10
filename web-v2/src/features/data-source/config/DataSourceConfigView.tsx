import { Alert, Button, Spin } from 'antd';
import type { Connection } from '@/core/connection/Connection';
import type { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { ConnectionCard } from './ConnectionCard';
import { DataSourceConfigHeader } from './DataSourceConfigHeader';
import { DataSourceEmpty } from './DataSourceEmpty';
import type { ConfigBody } from './dataSourceConfig.utils';
import { UnknownConnectionCard } from './UnknownConnectionCard';

export interface DataSourceConfigData {
  readonly body: ConfigBody;
  readonly connection: Connection | undefined;
  readonly history: RefreshSchemaHistory | undefined;
  readonly error: string | undefined;
  readonly isRefreshing: boolean;
  readonly isUpdatingSchema: boolean;
}

export interface DataSourceConfigActions {
  readonly onUpdateSchema: () => void;
  /** Refresh and Retry. */
  readonly onRefresh: () => void;
  /** Pick another type: Change, and the empty state's Click here. */
  readonly onChange: () => void;
  readonly onEdit: (connection: Connection) => void;
}

interface DataSourceConfigViewProps {
  data: DataSourceConfigData;
  actions: DataSourceConfigActions;
}

/** `/settings/organization/clickhouse-config` (v1 `ConnectorConfig.vue`): header, then one of the body states. */
export function DataSourceConfigView({ data, actions }: DataSourceConfigViewProps) {
  const { body, connection } = data;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataSourceConfigHeader
        connection={connection}
        isRefreshing={data.isRefreshing}
        isUpdatingSchema={data.isUpdatingSchema}
        onUpdateSchema={actions.onUpdateSchema}
        onRefresh={actions.onRefresh}
      />
      {body === 'loading' && <Spin className="mt-16" />}
      {body === 'error' && (
        <Alert
          type="error"
          showIcon
          title={data.error}
          action={
            <Button loading={data.isRefreshing} onClick={actions.onRefresh}>
              Retry
            </Button>
          }
        />
      )}
      {body === 'empty' && <DataSourceEmpty onSetup={actions.onChange} />}
      {body === 'unknown' && <UnknownConnectionCard onChange={actions.onChange} />}
      {body === 'connection' && connection && (
        <ConnectionCard connection={connection} history={data.history} onChange={actions.onChange} onEdit={actions.onEdit} />
      )}
    </div>
  );
}
