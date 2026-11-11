import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { EditDialogs } from './useEditDialogs';
import { ImageUrlModalView } from './ImageUrlModalView';
import { PickWidgetsModalView } from './PickWidgetsModalView';
import { RenameModalView } from './RenameModalView';
import { settingDraft } from './settings/dashboardSettings.utils';
import { EditDashboardModalView } from './settings/EditDashboardModalView';
import { EditWidgetsModalView } from './settings/EditWidgetsModalView';
import { ThemesModalView } from './settings/themes/ThemesModalView';
import { SortTabsModalView } from './SortTabsModalView';
import { pickOptionOf } from './pickWidgets.utils';
import { widgetsOfTab, widgetsToAdd } from './tabEdit.utils';
import { TabStyleModalView } from './TabStyleModalView';
import { TextEditorModalView } from './TextEditorModalView';
import { initialTextContent } from './textEditor.utils';

const NEW_WIDGET = {};

/** v1's words for moving widgets into a tab or a filter panel, and out of it (`TabViewer`, `FilterPanelViewer`). */
function pickTexts(mode: 'add' | 'remove', isPanel: boolean) {
  const what = isPanel ? 'filter' : 'chart';
  const where = isPanel ? 'panel' : 'tab';
  const title = isPanel ? 'Filter' : 'Chart';
  return mode === 'add'
    ? { title: `Add ${title}`, subtitle: `Select ${what} to add to this ${where}`, actionName: 'Add', emptyText: `No ${what}s have been added to this ${where}` }
    : { title: `Remove ${title}`, subtitle: `Remove ${what} from this ${where}`, actionName: 'Remove', emptyText: `No ${what}s have been removed from this ${where}` };
}

const SETTING_DIALOGS = { themes: ThemesModalView, editDashboard: EditDashboardModalView, editWidgets: EditWidgetsModalView };

interface EditDialogsViewProps {
  dialogs: EditDialogs;
  dashboard: Dashboard | undefined;
}

/** The dialog open in edit mode, if any. Each opening mounts a new one, so it starts from the widget. */
export function EditDialogsView({ dialogs, dashboard }: EditDialogsViewProps) {
  const { dialog, close } = dialogs;
  switch (dialog?.kind) {
    case 'text':
      if (!dashboard) return null;
      return (
        <TextEditorModalView
          title={dialog.widget ? 'Edit Text' : 'Add Text'}
          initial={initialTextContent(dialog.widget)}
          json={dialog.widget?.json ?? NEW_WIDGET}
          defaults={dashboard.setting.widgetSetting}
          themeName={dashboard.setting.themeName}
          onSubmit={dialogs.submitText}
          onCancel={close}
        />
      );
    case 'image':
      return (
        <ImageUrlModalView title={dialog.widget ? 'Replace Image' : 'Insert Image'} initial={dialog.widget?.url ?? ''} onSubmit={dialogs.submitImage} onCancel={close} />
      );
    case 'rename':
      return (
        <RenameModalView
          title={dialog.widget.kind === 'chart' ? 'Rename Chart' : 'Rename Widget'}
          label={dialog.widget.kind === 'chart' ? 'Chart Name' : 'Name'}
          initial={dialog.widget.name}
          onSubmit={dialogs.submitName}
          onCancel={close}
        />
      );
    case 'renameDashboard':
      return <RenameModalView title="Rename Dashboard" label="Dashboard Name" initial={dashboard?.name ?? ''} onSubmit={dialogs.submitName} onCancel={close} required />;
    case 'renameTab': {
      const isPanel = dialog.widget.kind === 'filter_panel';
      return (
        <RenameModalView
          title={isPanel ? 'Rename Filter Panel' : 'Rename Tab'}
          label={isPanel ? 'Title' : 'Tab Name'}
          initial={dialog.widget.tabItems[dialog.index]?.name ?? ''}
          onSubmit={dialogs.submitName}
          onCancel={close}
        />
      );
    }
    case 'pickWidgets': {
      if (!dashboard) return null;
      const { widget, index, mode } = dialog;
      const isPanel = widget.kind === 'filter_panel';
      const widgets = mode === 'add' ? widgetsToAdd(dashboard, widget) : widgetsOfTab(dashboard, widget, index);
      return <PickWidgetsModalView {...pickTexts(mode, isPanel)} options={widgets.map(pickOptionOf)} onSubmit={dialogs.submitPicked} onCancel={close} />;
    }
    case 'sortTabs':
      return <SortTabsModalView names={dialog.widget.tabItems.map(tab => tab.name)} onSubmit={dialogs.submitOrder} onCancel={close} />;
    case 'tabStyle':
      if (!dashboard) return null;
      return <TabStyleModalView widget={dialog.widget} themeName={dashboard.setting.themeName} onSubmit={dialogs.submitTabStyle} onCancel={close} />;
    case 'themes':
    case 'editDashboard':
    case 'editWidgets': {
      if (!dashboard) return null;
      const SettingDialog = SETTING_DIALOGS[dialog.kind];
      return <SettingDialog initial={settingDraft(dashboard)} onSubmit={dialogs.submitSettings} onCancel={close} />;
    }
    case undefined:
      return null;
  }
}
