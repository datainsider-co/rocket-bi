import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { JsonObject } from '@/core/json/json';
import { usePreview } from '@/features/chart-builder/preview/usePreview';
import { PreviewView } from '@/features/chart-builder/preview/PreviewView';
import { getDashboardTheme } from '@/features/dashboard/theme/dashboardThemes';
import type { Dashboard } from '@/core/dashboard/Dashboard';

interface ChartTabResultProps {
  /** The chart as it last ran (`shownChartJson`). */
  json: JsonObject;
  dashboard: Dashboard;
  /** Edit and Delete, when the user may (v1 hid them on the query tab and greyed them read only). */
  actions: { readonly onEdit: () => void; readonly onDelete: () => void } | undefined;
}

/** A chart tab's result (v1 `ChartHolder` with its action bar): the chart on the query, and Edit / Delete. */
export function ChartTabResult({ json, dashboard, actions }: ChartTabResultProps) {
  const preview = usePreview(json, dashboard.id);
  const themeColors = getDashboardTheme(dashboard.setting.themeName).colors;
  return (
    <div className="relative flex min-h-0 flex-1 flex-col p-3">
      {actions && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button size="small" icon={<EditOutlined />} aria-label="Edit chart" onClick={actions.onEdit} />
          <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete chart" onClick={actions.onDelete} />
        </div>
      )}
      <div className="min-h-0 flex-1">
        <PreviewView preview={preview} dashboardId={dashboard.id} themeColors={themeColors} />
      </div>
    </div>
  );
}
