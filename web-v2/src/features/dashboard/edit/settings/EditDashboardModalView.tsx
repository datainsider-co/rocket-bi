import type { JsonObject } from '@/core/json/json';
import { SettingsDialogView, type SettingsTab } from './SettingsDialogView';
import { DashboardBackgroundTab } from './tabs/DashboardBackgroundTab';
import { DashboardColorTab } from './tabs/DashboardColorTab';
import { DashboardSizeTab } from './tabs/DashboardSizeTab';

/** v1 `EditDashboardModal` tabs (its Theme tab was commented out; Themes has its own dialog). */
const TABS: readonly SettingsTab[] = [
  { key: 'size', label: 'Size', icon: 'di-icon-dashboard-2', render: section => <DashboardSizeTab {...section} /> },
  { key: 'background', label: 'Background', icon: 'di-icon-change-background', render: section => <DashboardBackgroundTab {...section} /> },
  { key: 'color', label: 'Color', icon: 'di-icon-color', render: section => <DashboardColorTab {...section} /> }
];

interface EditDashboardModalViewProps {
  initial: JsonObject;
  onSubmit: (setting: JsonObject) => Promise<void>;
  onCancel: () => void;
}

/** v1 `EditDashboardModal` "Dashboard Settings", from the gear's Edit Dashboard: size, background and color. */
export function EditDashboardModalView(props: EditDashboardModalViewProps) {
  return <SettingsDialogView id="edit-dashboard-setting" title="Dashboard Settings" icon="di-icon-dashboard-2" tabs={TABS} {...props} />;
}
