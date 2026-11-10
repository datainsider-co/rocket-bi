import { Spin, Table, Typography } from 'antd';
import { PREVIEW_ROW_KEY } from '@/shared/table-data/tableData.utils';
import { RESULT_PAGE_SIZE } from './queryResult.utils';
import type { QueryResult } from './useQueryRun';

type Row = Record<string, unknown>;

const PAGE_SIZES = [20, 50, 100];

/**
 * The result of the last Execute (v1 `QueryComponent`'s result area): the server's message when it failed, else the
 * rows, paged by the server, or on the screen when the SQL has a `limit` and the server sent them all.
 */
export function QueryResultView({ result }: { result: QueryResult }) {
  if (!result.run) {
    return (
      <p className="m-auto p-2 text-center font-medium">
        Write your SQL query above and then click Execute.
        <br />
        The results from your query will show up here.
      </p>
    );
  }
  if (result.error && !result.isFetching) {
    return (
      <pre className="m-0 overflow-auto p-4 whitespace-pre-wrap text-[var(--ant-color-error)]" role="alert">
        {result.error}
      </pre>
    );
  }
  if (result.isLoading) return <Spin className="m-auto" />;

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
        // A whole result pages here; antd keeps its own page then.
        ...(result.whole ? { defaultPageSize: RESULT_PAGE_SIZE } : { current: result.page, pageSize: result.pageSize, total: result.total, onChange: result.onPageChange }),
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZES,
        showTotal: total => (result.whole ? `${total} rows` : `Total: ${total}`)
      }}
    />
  );
}
