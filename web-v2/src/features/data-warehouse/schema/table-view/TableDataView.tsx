import { Button, Table, Typography } from 'antd';
import type { TableProps } from 'antd';
import { PREVIEW_ROW_KEY } from '../schema.utils';
import type { TablePreview } from '../useTablePreview';

type Row = Record<string, unknown>;

/** The Table Data tab (v1 `ViewData`): a page of rows, sorted on the server by a header click. */
export function TableDataView({ preview }: { preview: TablePreview }) {
  if (preview.error && preview.rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Typography.Text type="danger">{preview.error}</Typography.Text>
        <Button onClick={preview.retry}>Retry</Button>
      </div>
    );
  }

  const onChange: TableProps<Row>['onChange'] = (_pagination, _filters, sorter, { action }) => {
    if (action !== 'sort') return;
    const picked = Array.isArray(sorter) ? sorter[0] : sorter;
    const column = typeof picked?.columnKey === 'string' ? preview.columns.find(item => item.key === picked.columnKey) : undefined;
    preview.onSortChange(column && picked?.order ? { column: column.name, direction: picked.order === 'ascend' ? 'ASC' : 'DESC' } : undefined);
  };

  return (
    <Table<Row>
      rowKey={PREVIEW_ROW_KEY}
      dataSource={[...preview.rows]}
      loading={preview.isFetching}
      size="middle"
      scroll={{ x: 'max-content' }}
      showSorterTooltip={false}
      onChange={onChange}
      columns={preview.columns.map(column => ({
        key: column.key,
        title: column.title,
        dataIndex: column.key,
        sorter: true,
        sortOrder: preview.sort?.column === column.name ? (preview.sort.direction === 'ASC' ? 'ascend' : 'descend') : null,
        render: (value: unknown) => (value === null || value === undefined ? '' : String(value))
      }))}
      pagination={{
        current: preview.page,
        pageSize: preview.pageSize,
        total: preview.total,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100],
        showTotal: total => `Total: ${total}`,
        onChange: preview.onPageChange
      }}
    />
  );
}
