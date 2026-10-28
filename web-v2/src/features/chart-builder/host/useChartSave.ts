import { useMutation } from '@tanstack/react-query';
import { App } from 'antd';
import type { JsonObject } from '@/core/json/json';
import type { ChartBuilderRequest } from '@/features/dashboard/edit/chartBuilderBridge';
import type { DashboardEditor } from '@/features/dashboard/edit/useDashboardEditor';
import { saveActionOf, type SaveAction } from './builderSession.utils';

/**
 * Saves the built chart through the dashboard's editor, which updates the dashboard's cache (v1
 * `ChartBuilderModal.handleAddChart` / `handleUpdateChart`). A failure keeps the builder open with the server's
 * message, as v1 did.
 */
export function useChartSave(request: ChartBuilderRequest, editor: DashboardEditor, onSaved: () => void) {
  const { message } = App.useApp();
  const mutation = useMutation({
    mutationFn: (action: SaveAction) => (action.kind === 'create' ? editor.createWidget(action.json, action.position) : editor.updateWidget(action.json)),
    onSuccess: onSaved,
    onError: error => void message.error(error.message || 'Unknown error')
  });
  return {
    saving: mutation.isPending,
    save: (setting: JsonObject, extraData: JsonObject) => mutation.mutate(saveActionOf(request, setting, extraData))
  };
}
