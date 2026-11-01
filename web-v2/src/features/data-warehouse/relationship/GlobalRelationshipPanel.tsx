import { Alert, Button, Spin } from 'antd';
import { ReactFlowProvider } from '@xyflow/react';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { GlobalRelationshipEditor } from './GlobalRelationshipEditor';
import { useGlobalRelationship } from './useGlobalRelationship';

/** The right side of the Relationship page: the global relationships once loaded, or why they are not. */
export function GlobalRelationshipPanel() {
  const { data, error, dataUpdatedAt, refetch } = useGlobalRelationship();
  return (
    <section aria-label="Global relationships" className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-4">
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Alert type="error" showIcon title={toErrorMessage(error)} />
          <Button onClick={() => void refetch()}>Retry</Button>
        </div>
      ) : !data ? (
        <Spin className="mt-12 block" />
      ) : (
        <ReactFlowProvider>
          <GlobalRelationshipEditor key={dataUpdatedAt} data={data} />
        </ReactFlowProvider>
      )}
    </section>
  );
}
