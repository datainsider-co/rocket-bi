import { Alert, Modal, Spin } from 'antd';
import { ReactFlowProvider } from '@xyflow/react';
import { RelationshipEditor } from './RelationshipEditor';
import { useRelationshipData } from './useRelationshipData';

export interface RelationshipModalProps {
  dashboardId: number;
  /** Joins can be added, removed and saved; v1 allowed it only while the dashboard is in edit mode. */
  editable: boolean;
  open: boolean;
  onClose: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Cannot load the relationships';
}

function RelationshipModalBody({ dashboardId, editable, onClose }: Omit<RelationshipModalProps, 'open'>) {
  const { data, error, dataUpdatedAt } = useRelationshipData(dashboardId);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert type="error" showIcon title={errorMessage(error)} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <RelationshipEditor
        key={dataUpdatedAt}
        dashboardId={dashboardId}
        data={data}
        editable={editable}
        onSaved={onClose}
      />
    </ReactFlowProvider>
  );
}

/**
 * The dashboard's table relationships (v1 `RelationshipModal`): 95% of the screen, no footer, not closed by
 * clicking outside. Data loads each time it opens.
 */
export function RelationshipModal({ dashboardId, editable, open, onClose }: RelationshipModalProps) {
  return (
    <Modal
      open={open}
      title="Relationship"
      footer={null}
      onCancel={onClose}
      mask={{ closable: false }}
      destroyOnHidden
      centered
      width="95vw"
      styles={{ body: { height: 'calc(95vh - 76px)' } }}
    >
      <RelationshipModalBody dashboardId={dashboardId} editable={editable} onClose={onClose} />
    </Modal>
  );
}
