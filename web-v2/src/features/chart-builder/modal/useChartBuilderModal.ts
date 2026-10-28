import { useMemo } from 'react';
import { App } from 'antd';
import { pickerItemsOf } from '@/core/chart-builder/chartCatalogue';
import { asRecord, asString } from '@/core/json/json';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { ChartBuilderRequest } from '@/features/dashboard/edit/chartBuilderBridge';
import type { DashboardEditor } from '@/features/dashboard/edit/useDashboardEditor';
import { useFieldActions } from '../field-actions/useFieldActions';
import { useFieldTree } from '../field-tree/useFieldTree';
import { builderModeOf, previewJsonOf, typeKindOf, usedSettingsOf } from '../host/builderSession.utils';
import { useChartSave } from '../host/useChartSave';
import { usePreview } from '../preview/usePreview';
import { THEME_BACKGROUND } from '../settings/tabs/commonTabs.utils';
import { useBuilder } from '../state/BuilderContext';
import { builderExtraDataOf } from '../state/builderState.utils';
import type { BuilderActions } from './ChartBuilderModalView';

export interface ChartBuilderModalInput {
  request: ChartBuilderRequest;
  dashboard: Dashboard;
  editor: DashboardEditor;
  /** An ad hoc chart's table, shown alone in the tree. */
  adhocTable?: TableSchema;
  onClose: () => void;
}

/** Everything the builder modal shows: the tree, the type, the preview, and saving or leaving. */
export function useChartBuilderModal({ request, dashboard, editor, adhocTable, onClose }: ChartBuilderModalInput) {
  const { state, setting, dirty, dispatch, controls } = useBuilder();
  const { modal } = App.useApp();
  const usedSettings = useMemo(() => usedSettingsOf(request, dashboard), [request, dashboard]);
  // v1 `AdhocBuilderConfig`: no Chart Control tab on an ad hoc table.
  const tree = useFieldTree({ usedSettings, adhocTable, controls: adhocTable ? undefined : controls });
  const fieldActions = useFieldActions({ disabled: adhocTable !== undefined, tables: tree.tables, onExpand: tree.expand });
  const extraData = useMemo(() => builderExtraDataOf(state), [state]);
  const previewJson = useMemo(() => setting && previewJsonOf(request, setting, extraData), [request, setting, extraData]);
  const preview = usePreview(previewJson, dashboard.id);
  const { saving, save } = useChartSave(request, editor, onClose);
  const types = useMemo(() => pickerItemsOf(typeKindOf(request)), [request]);

  const onCancel = () => {
    if (!dirty) return onClose();
    void modal.confirm({
      title: 'Discard changes?',
      content: 'The changes to this chart will be lost.',
      okText: 'Discard',
      cancelText: 'Keep editing',
      onOk: onClose
    });
  };
  const actions: BuilderActions = {
    mode: builderModeOf(request),
    canSave: setting !== undefined && !preview.failed,
    saving,
    onSave: () => setting && save(setting, extraData),
    onCancel
  };

  return {
    tree: { ...tree.view, tables: { ...tree.view.tables, actions: fieldActions.tree } },
    tables: tree.nodes,
    fieldActions: { editMeasure: fieldActions.editMeasure, dialogs: fieldActions.dialogs },
    types: { items: types, value: state.data.chartType, onChange: (chartType: string) => dispatch({ type: 'chartType', chartType }) },
    preview,
    previewBackground: asString(asRecord(state.options['options'])['background']) || THEME_BACKGROUND,
    actions
  };
}
