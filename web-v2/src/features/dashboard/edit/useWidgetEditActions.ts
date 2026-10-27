import { useCallback, useEffect, useMemo } from 'react';
import { App } from 'antd';
import { withoutChartFilter } from '@/core/chart-builder/chartWidget';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { WidgetId } from '@/core/dashboard/Position';
import type { ChartWidget, TabWidget, Widget } from '@/core/dashboard/Widget';
import { childWidgetIds, copyWidgetJson, NEW_WIDGET_POSITION, newFilterPanelJson, newTabWidgetJson } from '@/core/dashboard/widgetJson';
import type { ChartBuilderBridge } from './chartBuilderBridge';
import { copiedText, copyPosition, isPasteError, pastedWidget } from './dashboardEdit.utils';
import type { AddHandlers, WidgetEditHandlers } from './editMenus.utils';
import { withTabAdded, withTabRemoved, type TabEditHandlers } from './tabEdit.utils';
import type { EditDialog } from './editDialogs';
import type { DashboardEditor } from './useDashboardEditor';

interface WidgetEditActionsInput {
  dashboard: Dashboard | undefined;
  editor: DashboardEditor | undefined;
  editing: boolean;
  openDialog: (dialog: EditDialog) => void;
  release: (ids: readonly WidgetId[]) => void;
  chartBuilder?: ChartBuilderBridge;
  clipboard?: Pick<Clipboard, 'readText' | 'writeText'>;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/**
 * What the widget menus and the Add menu do in edit mode (v1 `ChartHolder`, `OtherWidget`, `DashboardControlBar`).
 * Copy and paste go through the system clipboard, so a widget can move between dashboards; Ctrl+V pastes too.
 */
export function useWidgetEditActions({ dashboard, editor, editing, openDialog, release, chartBuilder, clipboard = navigator.clipboard }: WidgetEditActionsInput) {
  const { message, modal } = App.useApp();

  const run = useCallback(
    async (task: () => Promise<unknown>, failure: string) => {
      try {
        await task();
      } catch {
        void message.error(failure);
      }
    },
    [message]
  );

  const pasteText = useCallback(
    (text: string) => {
      if (!editor) return;
      const pasted = pastedWidget(text, window.location.origin);
      if (isPasteError(pasted)) {
        void message.error(pasted.error);
        return;
      }
      const position = { ...NEW_WIDGET_POSITION.text, ...pasted.size, row: -1, column: -1 };
      void run(() => editor.createWidget(copyWidgetJson(pasted.json), position), 'Failed to paste chart');
    },
    [editor, message, run]
  );

  useEffect(() => {
    if (!editing) return;
    const onPaste = (event: ClipboardEvent) => {
      if (isTyping(event.target)) return;
      const text = event.clipboardData?.getData('text');
      if (text) pasteText(text);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [editing, pasteText]);

  const positions = dashboard?.positions;
  const widget = useMemo((): WidgetEditHandlers => {
    const positionOf = (target: Widget) => positions?.[target.id];
    return {
    rename: target => openDialog({ kind: 'rename', widget: target }),
    editText: target => target.kind === 'text' && openDialog({ kind: 'text', widget: target }),
    replaceImage: target => target.kind === 'image' && openDialog({ kind: 'image', widget: target }),
    ...(chartBuilder && {
      configChart: (target: Widget) => target.kind === 'chart' && chartBuilder.open({ kind: 'configChart', chart: target }),
      innerFilter: {
        add: (chart: ChartWidget) => chartBuilder.open({ kind: 'addInnerFilter', chart }),
        config: (chart: ChartWidget) => chartBuilder.open({ kind: 'configInnerFilter', chart }),
        remove: (chart: ChartWidget) => void run(() => editor!.updateWidget(withoutChartFilter(chart.json)), 'Can not delete chart filter, try again')
      }
    }),
    copy: target =>
      void run(async () => {
        await clipboard.writeText(copiedText(target, positionOf(target), window.location.href));
        void message.success('Copied');
      }, 'Copy chart failed, please try again later'),
    duplicate: target =>
      void run(
        () => editor!.createWidget(copyWidgetJson(target.json), copyPosition(positionOf(target), NEW_WIDGET_POSITION.text)),
        'Can not duplicate widget, refresh page and try again'
      ),
    remove: target =>
      void modal.confirm({
        title: 'Remove widget',
        content: 'Are you sure that you want to remove this widget?',
        okText: 'Yes',
        cancelText: 'No',
        onOk: () =>
          run(async () => {
            // The children of a tab land on the dashboard, in free slots (v1 left them where they were in the tab).
            const children = childWidgetIds(target);
            await editor!.deleteWidget(target);
            release(children);
          }, 'Can not remove widget, refresh page and try again')
      })
    };
  }, [positions, editor, openDialog, release, chartBuilder, clipboard, message, modal, run]);

  const tab = useMemo(
    (): TabEditHandlers => ({
      addTab: target => void run(() => editor!.updateWidget(withTabAdded(target, 'New tab')), 'Can not add tab, try again'),
      renameTab: (target, index) => openDialog({ kind: 'renameTab', widget: target, index }),
      addWidgets: (target, index) => openDialog({ kind: 'pickWidgets', widget: target, index, mode: 'add' }),
      removeWidgets: (target, index) => openDialog({ kind: 'pickWidgets', widget: target, index, mode: 'remove' }),
      deleteTab: (target: TabWidget, index: number) =>
        void run(async () => {
          const { json, released } = withTabRemoved(target, index);
          await editor!.updateWidget(json);
          release(released);
        }, 'Can not delete tab, try again'),
      sortTabs: target => openDialog({ kind: 'sortTabs', widget: target }),
      configTab: target => openDialog({ kind: 'tabStyle', widget: target }),
      remove: target => widget.remove(target)
    }),
    [editor, openDialog, release, run, widget]
  );

  const add = useMemo((): AddHandlers => ({
    addText: () => openDialog({ kind: 'text' }),
    addImage: () => openDialog({ kind: 'image' }),
    addTab: () => void run(() => editor!.createWidget(newTabWidgetJson(), NEW_WIDGET_POSITION.tab), 'Can not add tab, try again'),
    addFilterPanel: () => void run(() => editor!.createWidget(newFilterPanelJson(), NEW_WIDGET_POSITION.tab), 'Can not add filter panel, try again'),
    ...(typeof clipboard?.readText === 'function' && {
      paste: () => void run(async () => pasteText(await clipboard.readText()), 'Can not read the clipboard')
    }),
    ...(chartBuilder && { addChart: () => chartBuilder.open({ kind: 'addChart' }) })
  }), [editor, openDialog, run, clipboard, pasteText, chartBuilder]);

  return { widget, tab, add };
}
