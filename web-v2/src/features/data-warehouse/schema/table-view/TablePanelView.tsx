import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Segmented, Spin, Typography } from 'antd';
import { isProcessing, SchemaTab } from '../schema.utils';
import { TableColumnsView } from './TableColumnsView';
import { TableDataTab } from './TableDataTab';
import { TablePanelHeader, type TableActions } from './TablePanelHeader';
import type { TablePanelData } from './useTablePanel';

const TABS = [
  { value: SchemaTab.Schema, label: 'Table Schema' },
  { value: SchemaTab.Data, label: 'Table Data' }
];

interface TablePanelViewProps {
  dbName: string;
  data: TablePanelData;
  actions: TableActions;
}

/** A table's view (v1 `DataSchema` with a table): its header, then Table Schema or Table Data. */
export function TablePanelView({ dbName, data, actions }: TablePanelViewProps) {
  const { table } = data;
  return (
    <section aria-label={`Table ${table?.displayName ?? ''}`} className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-4">
      <TablePanelHeader dbName={dbName} table={table} actions={actions} />
      {data.status === 'loading' && <Spin className="mt-8 block" />}
      {data.status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Typography.Text type="danger">{data.error}</Typography.Text>
          <Button onClick={data.retry}>Retry</Button>
        </div>
      )}
      {table && (
        <>
          {isProcessing(table) && <Alert className="mb-3" type="info" showIcon message="The table is being processed. It refreshes every 30 seconds." />}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Segmented options={TABS} value={data.tab} onChange={value => data.onTabChange(value)} />
            {data.tab === SchemaTab.Schema && (
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search columns..."
                aria-label="Search columns"
                className="ml-auto w-56 max-sm:ml-0 max-sm:w-full"
                value={data.columnSearch}
                onChange={event => data.onColumnSearchChange(event.target.value)}
              />
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {data.tab === SchemaTab.Schema ? <TableColumnsView columns={data.columns} total={table.columns.length} /> : <TableDataTab key={`${table.dbName}.${table.name}`} table={table} />}
          </div>
        </>
      )}
    </section>
  );
}
