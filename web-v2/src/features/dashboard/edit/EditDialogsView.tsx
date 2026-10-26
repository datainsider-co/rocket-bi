import type { Dashboard } from '@/core/dashboard/Dashboard';
import { tabHeaderStyleOf } from '../widgets/tab/tabWidget.utils';
import type { EditDialogs } from './useEditDialogs';
import { ImageUrlModalView } from './ImageUrlModalView';
import { PickWidgetsModalView } from './PickWidgetsModalView';
import { RenameModalView } from './RenameModalView';
import { settingDraft } from './settings/dashboardSettings.utils';
import { DashboardSettingsModalView } from './settings/DashboardSettingsModalView';
import { SortTabsModalView } from './SortTabsModalView';
import { applyButtonStyleOf, widgetLabel, widgetsOfTab, widgetsToAdd } from './tabEdit.utils';
import { TabStyleModalView } from './TabStyleModalView';
import { TextEditorModalView } from './TextEditorModalView';
import { initialTextContent } from './textEditor.utils';

interface EditDialogsViewProps {
  dialogs: EditDialogs;
  dashboard: Dashboard | undefined;
}

/** The dialog open in edit mode, if any. Each opening mounts a new one, so it starts from the widget. */
export function EditDialogsView({ dialogs, dashboard }: EditDialogsViewProps) {
  const { dialog, close } = dialogs;
  switch (dialog?.kind) {
    case 'text':
      return (
        <TextEditorModalView
          title={dialog.widget ? 'Edit Text' : 'Add Text'}
          initial={initialTextContent(dialog.widget)}
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
      const what = isPanel ? 'filter' : 'chart';
      const widgets = mode === 'add' ? widgetsToAdd(dashboard, widget) : widgetsOfTab(dashboard, widget, index);
      return (
        <PickWidgetsModalView
          title={`${mode === 'add' ? 'Add' : 'Remove'} ${isPanel ? 'Filter' : 'Chart'}`}
          actionName={mode === 'add' ? 'Add' : 'Remove'}
          emptyText={mode === 'add' ? `No ${what} on the dashboard to add` : `No ${what} in this ${isPanel ? 'panel' : 'tab'}`}
          options={widgets.map(item => ({ id: item.id, label: widgetLabel(item) }))}
          onSubmit={dialogs.submitPicked}
          onCancel={close}
        />
      );
    }
    case 'sortTabs':
      return <SortTabsModalView names={dialog.widget.tabItems.map(tab => tab.name)} onSubmit={dialogs.submitOrder} onCancel={close} />;
    case 'tabStyle': {
      const isPanel = dialog.widget.kind === 'filter_panel';
      return (
        <TabStyleModalView
          title={isPanel ? 'Filter Panel Setting' : 'Tab Setting'}
          header={tabHeaderStyleOf(dialog.widget)}
          apply={isPanel ? applyButtonStyleOf(dialog.widget) : undefined}
          onSubmit={dialogs.submitTabStyle}
          onCancel={close}
        />
      );
    }
    case 'settings':
      return dashboard ? <DashboardSettingsModalView initial={settingDraft(dashboard)} onSubmit={dialogs.submitSettings} onCancel={close} /> : null;
    case undefined:
      return null;
  }
}
