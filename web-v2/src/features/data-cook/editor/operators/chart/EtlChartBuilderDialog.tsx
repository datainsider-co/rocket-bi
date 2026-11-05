import type { EtlGraph } from '@/core/data-cook/etlGraph';
import { readRenderOptions } from '@/core/data-cook/etlExtraData';
import type { EtlOperator } from '@/core/data-cook/EtlOperator';
import type { JsonObject } from '@/core/json/json';
import { BuilderProvider } from '@/features/chart-builder/state/BuilderContext';
import type { TablePreviewState } from '../../preview/useEtlPreview';
import { dialogTexts, knownTable, newTableConfig, type OperatorDialog } from '../operators.utils';
import type { OperatorExtras } from '../useOperatorDialog';
import { builderWidgetOf, newQueryOperator } from './etlChart.utils';
import { EtlChartBuilder } from './EtlChartBuilder';

interface EtlChartBuilderDialogProps {
  dialog: OperatorDialog & { kind: 'transform' | 'pivot' };
  graph: EtlGraph;
  /** The draft's `extra_data`, where v1 kept each Transform's and Pivot's builder state. */
  extraData: JsonObject;
  previews: ReadonlyMap<string, TablePreviewState>;
  dbName: string;
  onAdd: (operator: EtlOperator, parentNames: readonly string[], extras?: OperatorExtras) => void;
  onUpdate: (operator: EtlOperator, renderOptions?: JsonObject) => void;
  onCancel: () => void;
}

const NO_CONTROLS: never[] = [];

/** Transform Table or Pivot Table after a table, or one edited, built with ChartBuilder on the table it reads. */
export function EtlChartBuilderDialog({ dialog, graph, extraData, previews, dbName, onAdd, onUpdate, onCancel }: EtlChartBuilderDialogProps) {
  const { kind } = dialog;
  const found = dialog.mode === 'edit' ? graph.operators.get(dialog.tblName) : undefined;
  const editing = found?.kind === kind ? found : undefined;
  const parentName = dialog.mode === 'add' ? dialog.parent : (graph.parentNames.get(dialog.tblName)?.[0] ?? '');
  const parent = graph.operators.get(parentName);
  if (!parent || (dialog.mode === 'edit' && !editing)) return null;

  const start = builderWidgetOf(kind, editing, editing && readRenderOptions(extraData, editing.destTable.tblName));
  const submit = (query: JsonObject, renderOptions: JsonObject) => {
    if (editing) onUpdate({ ...editing, query }, renderOptions);
    else onAdd(newQueryOperator(kind, parent, newTableConfig(graph, [parent]), query), [parentName], { renderOptions });
  };
  return (
    <BuilderProvider start={start} controls={NO_CONTROLS}>
      <EtlChartBuilder
        title={dialogTexts(dialog).title}
        kind={kind}
        table={knownTable(previews, parent, dbName)}
        mode={dialog.mode === 'add' ? 'add' : 'update'}
        onSubmit={submit}
        onCancel={onCancel}
      />
    </BuilderProvider>
  );
}
