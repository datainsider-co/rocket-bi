import { Alert, Button, Spin, Typography } from 'antd';
import { isProcessing } from '../schema.utils';
import { TablePanelHeader, type TableActions } from './TablePanelHeader';
import { TableTabContent } from './TableTabContent';
import { TableTabToolbar } from './TableTabToolbar';
import type { TablePanelData } from './useTablePanel';

interface TablePanelViewProps {
  dbName: string;
  data: TablePanelData;
  actions: TableActions;
  /** A phone: no formula tabs, no edit mode (v1). */
  narrow: boolean;
}

/** A table's view (v1 `DataSchema` with a table): its header, the tabs, then the tab's content. */
export function TablePanelView({ dbName, data, actions, narrow }: TablePanelViewProps) {
  const { table, schema } = data;
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
      {table && schema && (
        <>
          {isProcessing(table) && <Alert className="mb-3" type="info" showIcon message="The table is being processed. It refreshes every 30 seconds." />}
          <TableTabToolbar data={data} table={table} schema={schema} narrow={narrow} />
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            <TableTabContent data={data} table={table} schema={schema} />
          </div>
        </>
      )}
    </section>
  );
}
