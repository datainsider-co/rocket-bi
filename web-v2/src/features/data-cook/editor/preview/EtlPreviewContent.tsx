import { Button, Spin, Typography } from 'antd';
import type { TablePreviewState } from './useEtlPreview';
import { PreviewTableData } from './PreviewTableData';

interface EtlPreviewContentProps {
  tblName: string;
  state: TablePreviewState;
  onRetry: (tblName: string) => void;
}

/** The shown table: its rows, or why there are none (v1 `ErrorWidget`, without the HTML of its message). */
export function EtlPreviewContent({ tblName, state, onRetry }: EtlPreviewContentProps) {
  switch (state.status) {
    case 'loading':
      return <Spin className="m-auto" />;
    case 'blocked':
      return <Typography.Text type="secondary" className="m-auto p-4 text-center">{state.message}</Typography.Text>;
    case 'error':
      return (
        <div className="m-auto flex max-w-full flex-col items-center gap-3 p-4">
          <pre className="m-0 max-h-40 overflow-auto whitespace-pre-wrap text-[var(--ant-color-error)]" role="alert">
            {state.message}
          </pre>
          <Button onClick={() => onRetry(tblName)}>Retry</Button>
        </div>
      );
    case 'ready':
      return state.table ? <PreviewTableData key={`${tblName}:${state.signature}`} table={state.table} signature={state.signature} /> : null;
  }
}
