import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { EtlGraph } from '@/core/data-cook/etlGraph';
import type { EtlId } from '@/core/data-cook/EtlJob';
import { EtlPreviewService } from '@/core/data-cook/EtlPreviewService';
import { etlDatabaseQueryOptions } from '../../dataCookQueries';
import type { TablePreviewState } from '../preview/useEtlPreview';
import { JoinDialog } from './join/JoinDialog';
import { ManageFieldsDialog } from './manage-fields/ManageFieldsDialog';
import { SqlQueryDialog } from './sql/SqlQueryDialog';
import type { OperatorDialogModel } from './useOperatorDialog';

interface OperatorDialogHostProps {
  etlId: EtlId;
  graph: EtlGraph;
  previews: ReadonlyMap<string, TablePreviewState>;
  operator: OperatorDialogModel;
}

/** The open operator dialog, once the ETL's preview database is known: the operators' SQL and fields name it. */
export function OperatorDialogHost({ etlId, graph, previews, operator }: OperatorDialogHostProps) {
  const { dialog, close, add, update } = operator;
  const database = useQuery({ ...etlDatabaseQueryOptions(useDi(EtlPreviewService), etlId), enabled: dialog !== undefined && etlId !== 0 });
  // Every preview table is in that database too.
  const dbName = database.data ?? [...previews.values()].find(state => state.table)?.table?.dbName;
  if (!dialog || dbName === undefined) return null;

  switch (dialog.kind) {
    case 'sql':
      return <SqlQueryDialog dialog={dialog} graph={graph} previews={previews} dbName={dbName} onAdd={add} onUpdate={update} onCancel={close} />;
    case 'join':
      return <JoinDialog dialog={dialog} context={{ graph, previews, dbName, onAdd: add, onUpdate: update }} onCancel={close} />;
    case 'manageFields':
      return <ManageFieldsDialog dialog={dialog} etlId={etlId} graph={graph} previews={previews} dbName={dbName} onAdd={add} onUpdate={update} onCancel={close} />;
  }
}
