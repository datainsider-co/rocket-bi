import { getDashboardTheme } from '@/features/dashboard/theme/dashboardThemes';
import { ConfigPanel } from '../config-panel/ConfigPanel';
import { FieldChoicesContext } from '../config-panel/FieldChoicesContext';
import { BuilderDndProvider } from '../dnd/BuilderDndProvider';
import { EditMeasureContext } from '../field-actions/EditMeasureContext';
import { FieldActionDialog } from '../field-actions/FieldActionDialog';
import { FieldTreeView } from '../field-tree/FieldTreeView';
import { ChartTypeStripView } from '../picker/ChartTypeStripView';
import { PreviewHintView } from '../preview/PreviewHintView';
import { PreviewView } from '../preview/PreviewView';
import { SettingsPanel } from '../settings/SettingsPanel';
import { ChartBuilderModalView } from './ChartBuilderModalView';
import { useChartBuilderModal, type ChartBuilderModalInput } from './useChartBuilderModal';

/** The builder modal; place it inside `BuilderProvider`, within the dashboard's controls. */
export function ChartBuilderModal(props: ChartBuilderModalInput) {
  const { tree, tables, fieldActions, types, preview, actions } = useChartBuilderModal(props);
  const { dashboard } = props;
  const theme = getDashboardTheme(dashboard.setting.themeName);
  const themeColors = theme.colors;
  const currentType = types.items.find(item => item.type === types.value);
  const card = { defaults: dashboard.setting.widgetSetting, themeCssName: theme.cssName };
  return (
    <FieldChoicesContext value={tables}>
      <EditMeasureContext value={fieldActions.editMeasure}>
        <BuilderDndProvider>
          <ChartBuilderModalView
            actions={actions}
            slots={{
              types: <ChartTypeStripView {...types} />,
              tree: <FieldTreeView {...tree} />,
              panel: <ConfigPanel />,
              settings: <SettingsPanel response={preview.data.data} themeColors={themeColors} filterEntry={preview.filter.entry} />,
              preview: <PreviewView preview={preview} dashboardId={dashboard.id} themeColors={themeColors} card={card} hint={currentType && <PreviewHintView type={currentType} />} />
            }}
          />
        </BuilderDndProvider>
        <FieldActionDialog {...fieldActions.dialogs} />
      </EditMeasureContext>
    </FieldChoicesContext>
  );
}
