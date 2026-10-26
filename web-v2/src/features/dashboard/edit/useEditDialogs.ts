import { useCallback, useState } from 'react';
import type { WidgetId } from '@/core/dashboard/Position';
import type { JsonObject } from '@/core/json/json';
import { imageWidgetJson, NEW_WIDGET_POSITION, renamedWidgetJson, textWidgetJson, type TextContent } from '@/core/dashboard/widgetJson';
import type { EditDialog } from './editDialogs';
import type { TabHeaderStyle } from '../widgets/tab/tabWidget.utils';
import { withTabRenamed, withTabsOrdered, withTabStyle, withWidgetsAdded, withWidgetsRemoved, type ApplyButtonStyle } from './tabEdit.utils';
import type { DashboardEditor } from './useDashboardEditor';

/**
 * The dialog open in edit mode, and what each one saves (v1 `EditTextModal`, `ImageBrowserModal`, `DiRenameModal`,
 * `AddChartModal`, `SortModal`, `TabSettingModal`). `release` gives widgets moved in or out of a tab a free slot.
 */
export function useEditDialogs(editor: DashboardEditor | undefined, release: (ids: readonly WidgetId[]) => void) {
  const [dialog, setDialog] = useState<EditDialog>();
  const close = useCallback(() => setDialog(undefined), []);

  const submitText = async (content: TextContent) => {
    if (!editor || dialog?.kind !== 'text') return;
    if (dialog.widget) await editor.updateWidget(textWidgetJson(dialog.widget.json, content));
    else await editor.createWidget(textWidgetJson({}, content), NEW_WIDGET_POSITION.text);
    close();
  };

  const submitImage = async (url: string) => {
    if (!editor || dialog?.kind !== 'image') return;
    if (dialog.widget) await editor.updateWidget(imageWidgetJson(dialog.widget.json, url));
    else await editor.createWidget(imageWidgetJson({}, url), NEW_WIDGET_POSITION.image);
    close();
  };

  const submitName = async (name: string) => {
    if (!editor) return;
    if (dialog?.kind === 'rename') await editor.updateWidget(renamedWidgetJson(dialog.widget, name));
    if (dialog?.kind === 'renameDashboard') await editor.rename(name);
    if (dialog?.kind === 'renameTab') await editor.updateWidget(withTabRenamed(dialog.widget, dialog.index, name));
    close();
  };

  const submitPicked = async (ids: readonly WidgetId[]) => {
    if (!editor || dialog?.kind !== 'pickWidgets') return;
    const { widget, index, mode } = dialog;
    await editor.updateWidget(mode === 'add' ? withWidgetsAdded(widget, index, ids) : withWidgetsRemoved(widget, index, ids));
    release(ids);
    close();
  };

  const submitOrder = async (order: readonly number[]) => {
    if (!editor || dialog?.kind !== 'sortTabs') return;
    await editor.updateWidget(withTabsOrdered(dialog.widget, order));
    close();
  };

  const submitTabStyle = async (header: TabHeaderStyle, apply?: ApplyButtonStyle) => {
    if (!editor || dialog?.kind !== 'tabStyle') return;
    await editor.updateWidget(withTabStyle(dialog.widget, header, apply));
    close();
  };

  const submitSettings = async (setting: JsonObject) => {
    if (!editor || dialog?.kind !== 'settings') return;
    await editor.saveSetting(setting);
    close();
  };

  return { dialog, open: setDialog, close, submitText, submitImage, submitName, submitPicked, submitOrder, submitTabStyle, submitSettings };
}

export type EditDialogs = ReturnType<typeof useEditDialogs>;
