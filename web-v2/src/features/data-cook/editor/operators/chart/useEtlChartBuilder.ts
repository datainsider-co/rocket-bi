import { useMemo } from 'react';
import { App } from 'antd';
import type { JsonObject } from '@/core/json/json';
import type { TableSchema } from '@/core/schema/SchemaService';
import { useFieldTree } from '@/features/chart-builder/field-tree/useFieldTree';
import type { BuilderActions } from '@/features/chart-builder/modal/ChartBuilderModalView';
import { useBuilder } from '@/features/chart-builder/state/BuilderContext';
import { builderExtraDataOf } from '@/features/chart-builder/state/builderState.utils';
import { previewQueryOf, storedQueryOf, storedRenderOptionsOf, type ChartOperatorKind } from './etlChart.utils';
import { useBuilderResult } from './useBuilderResult';

const NO_SETTINGS: readonly JsonObject[] = [];

export interface EtlChartBuilderInput {
  readonly kind: ChartOperatorKind;
  /** The table the operator reads, in the preview database: the tree's only table (v1 "Table & Field"). */
  readonly table: TableSchema;
  readonly mode: 'add' | 'update';
  /** The query the operator stores, and the builder state kept in `extra_data`. */
  readonly onSubmit: (query: JsonObject, renderOptions: JsonObject) => void;
  readonly onCancel: () => void;
}

/**
 * The builder of a Transform or Pivot (v1 data-cook `ChartBuilder`): the table it reads alone in the tree, the zones
 * of its fixed chart type, the table it gives. No settings, no measures (the preview tables have none).
 */
export function useEtlChartBuilder({ kind, table, mode, onSubmit, onCancel }: EtlChartBuilderInput) {
  const { state, setting, dirty } = useBuilder();
  const { modal } = App.useApp();
  const tree = useFieldTree({ usedSettings: NO_SETTINGS, adhocTable: table });
  const query = useMemo(() => setting && previewQueryOf(kind, setting), [kind, setting]);
  const result = useBuilderResult(query);

  const cancel = () => {
    if (!dirty) return onCancel();
    void modal.confirm({
      title: 'Discard changes?',
      content: 'The changes to this table will be lost.',
      okText: 'Discard',
      cancelText: 'Keep editing',
      onOk: onCancel
    });
  };
  const actions: BuilderActions = {
    mode,
    canSave: setting !== undefined && result.error === undefined,
    saving: false,
    onSave: () => setting && onSubmit(storedQueryOf(setting), storedRenderOptionsOf(kind, builderExtraDataOf(state))),
    onCancel: cancel
  };
  return { tree: tree.view, nodes: tree.nodes, result, actions };
}
