import { Alert, Button, Card, Descriptions } from 'antd';
import type { Connection } from '@/core/connection/Connection';
import type { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { formatDateTime } from '@/shared/listing/listing.utils';
import { StatusTag } from '@/shared/listing/StatusTag';
import { connectionRows, toRefreshStatusView } from './dataSourceConfig.utils';

interface ConnectionCardProps {
  connection: Connection;
  history: RefreshSchemaHistory | undefined;
  onChange: () => void;
  onEdit: (connection: Connection) => void;
}

/** v1's one-row DataSource table as a card: the connection's fields, Updated Time, refresh status, Change and Edit. */
export function ConnectionCard({ connection, history, onChange, onEdit }: ConnectionCardProps) {
  const status = toRefreshStatusView(history);

  return (
    <Card
      title={connection.displayName}
      extra={
        <div className="flex gap-2">
          <Button onClick={onChange}>Change</Button>
          <Button type="primary" onClick={() => onEdit(connection)}>
            Edit
          </Button>
        </div>
      }
    >
      <Descriptions
        column={{ xs: 1, sm: 2 }}
        items={[
          ...connectionRows(connection).map(row => ({ key: row.label, label: row.label, children: row.value })),
          { key: 'updated', label: 'Updated Time', children: formatDateTime(connection.updatedAt) },
          { key: 'status', label: 'Status', children: <StatusTag status={status.label} icon={status.icon} /> }
        ]}
      />
      {status.error && <Alert className="mt-4" type="error" showIcon title="Schema refresh failed" description={status.error} />}
    </Card>
  );
}
