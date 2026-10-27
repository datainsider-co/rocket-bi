import { getDashboardTheme } from '@/features/dashboard/theme/dashboardThemes';
import { ConfigPanel } from '../config-panel/ConfigPanel';
import { FieldChoicesContext } from '../config-panel/FieldChoicesContext';
import { BuilderDndProvider } from '../dnd/BuilderDndProvider';
import { FieldTreeView } from '../field-tree/FieldTreeView';
import { ChartTypeSelectView } from '../picker/ChartTypeSelectView';
import { PreviewView } from '../preview/PreviewView';
import { ChartBuilderModalView } from './ChartBuilderModalView';
import { useChartBuilderModal, type ChartBuilderModalInput } from './useChartBuilderModal';

/** The builder modal; place it inside `BuilderProvider`, within the dashboard's controls. */
export function ChartBuilderModal(props: ChartBuilderModalInput) {
  const { tree, tables, types, preview, actions } = useChartBuilderModal(props);
  const { dashboard } = props;
  return (
    <FieldChoicesContext value={tables}>
      <BuilderDndProvider>
        <ChartBuilderModalView
          actions={actions}
          slots={{
            types: <ChartTypeSelectView {...types} />,
            tree: <FieldTreeView {...tree} />,
            panel: <ConfigPanel />,
            preview: <PreviewView preview={preview} dashboardId={dashboard.id} themeColors={getDashboardTheme(dashboard.setting.themeName).colors} />
          }}
        />
      </BuilderDndProvider>
    </FieldChoicesContext>
  );
}
