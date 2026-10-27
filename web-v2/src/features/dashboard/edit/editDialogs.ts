import type { ImageWidget, TabWidget, TextWidget, Widget } from '@/core/dashboard/Widget';

/** The dialog open in edit mode; the widget is absent when adding. */
export type EditDialog =
  | { kind: 'text'; widget?: TextWidget }
  | { kind: 'image'; widget?: ImageWidget }
  | { kind: 'rename'; widget: Widget }
  | { kind: 'renameDashboard' }
  | { kind: 'renameTab'; widget: TabWidget; index: number }
  /** Widgets to move into the tab, or out of it back to the dashboard (v1 `AddChartModal`). */
  | { kind: 'pickWidgets'; widget: TabWidget; index: number; mode: 'add' | 'remove' }
  | { kind: 'sortTabs'; widget: TabWidget }
  | { kind: 'tabStyle'; widget: TabWidget }
  /** The dashboard's own settings: v1 Themes (Options → Settings, the gear's Themes), Edit Dashboard, Edit Widgets. */
  | { kind: SettingDialogKind };

export type SettingDialogKind = 'themes' | 'editDashboard' | 'editWidgets';

export function isSettingDialog(dialog: EditDialog | undefined): dialog is { kind: SettingDialogKind } {
  return dialog?.kind === 'themes' || dialog?.kind === 'editDashboard' || dialog?.kind === 'editWidgets';
}
