import { Button, Typography } from 'antd';

/** v1 `LayoutNoData` of `ConnectorConfig`: "No DataSource yet", Click here to set one up. */
export function DataSourceEmpty({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-2 rounded">
      <i className="di-icon-datasource text-5xl opacity-40" aria-hidden />
      <Typography.Text strong>No DataSource yet</Typography.Text>
      <Typography.Text type="secondary">
        <Button type="link" className="!p-0" onClick={onSetup}>
          Click here
        </Button>{' '}
        to setup DataSource
      </Typography.Text>
    </div>
  );
}
