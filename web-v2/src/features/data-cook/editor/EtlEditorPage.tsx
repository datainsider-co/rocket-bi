import { ReactFlowProvider } from '@xyflow/react';
import { useParams } from 'react-router';
import { NotFoundPage } from '@/app/error/NotFoundPage';
import { etlIdFromParam, NEW_ETL_SEGMENT } from '../dataCook.utils';
import { EtlEditorLoader } from './EtlEditorLoader';
import { useEditorSession } from './session/useEditorSession';

/**
 * `/data-warehouse/data-cook/my-etl/create` and `my-etl/:name` (v1 `ManageEtlJob.vue`). One route: a new ETL gets its
 * id and URL while it is edited, and the editor stays (`useEditorSession`). Opening another ETL starts over.
 */
export function EtlEditorPage() {
  const { name } = useParams();
  const isNew = name === NEW_ETL_SEGMENT;
  const id = isNew ? undefined : etlIdFromParam(name);
  const session = useEditorSession(id);
  if (!isNew && id === undefined) return <NotFoundPage />;

  return (
    <ReactFlowProvider key={session.key}>
      <EtlEditorLoader startId={session.startId} onCreated={session.onCreated} />
    </ReactFlowProvider>
  );
}
