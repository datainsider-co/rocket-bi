import { Button, Empty, Spin, Table, Typography } from 'antd';
import { PREVIEW_ROW_KEY } from '@/shared/table-data/tableData.utils';
import type { BuilderResult } from './useBuilderResult';

type Row = Record<string, unknown>;

/** The table being built: a hint until the zones are filled, then its rows or the server's message. */
export function BuilderResultView({ result }: { result: BuilderResult }) {
  if (result.empty) {
    return <Empty className="flex h-full flex-col items-center justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Drag and drop fields into the zones to build the table" />;
  }
  if (result.isPending) return <Spin className="flex! h-full items-center justify-center" />;
  if (result.error && !result.isFetching) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="line-clamp-4 text-xs text-[var(--ant-color-error,#ff4d4f)]" role="alert">
          {result.error}
        </div>
        <Button size="small" onClick={result.retry}>
          Retry
        </Button>
      </div>
    );
  }
  return (
    <Table<Row>
      rowKey={PREVIEW_ROW_KEY}
      dataSource={[...result.rows]}
      loading={result.isFetching}
      size="small"
      scroll={{ x: 'max-content' }}
      columns={result.columns.map(column => ({
        key: column.key,
        title: column.title,
        dataIndex: column.key,
        render: (value: unknown) => (value === null || value === undefined ? <Typography.Text type="secondary">null</Typography.Text> : String(value))
      }))}
      pagination={{
        current: result.page,
        pageSize: result.pageSize,
        total: result.total,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100],
        showTotal: total => `Total: ${total}`,
        onChange: result.onPageChange
      }}
    />
  );
}
