import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { DashboardSetting } from '@/core/dashboard/DashboardSetting';
import { DashboardService } from '@/core/dashboard/DashboardService';
import type { Position, PositionMap } from '@/core/dashboard/Position';
import { widgetFromJson, type Widget } from '@/core/dashboard/Widget';
import type { JsonObject } from '@/core/json/json';
import { dashboardKeys } from '../detail/dashboardQueries';
import { tabsWithout, withoutWidget, withWidget } from './dashboardEdit.utils';

/**
 * Saves the dashboard's edits on the server and in its query cache (v1 `WidgetStore`, `DashboardStore`). Each write is
 * saved at once, like v1; only the layout waits for Save.
 */
export function useDashboardEditor(dashboardId: number) {
  const service = useDi(DashboardService);
  const queryClient = useQueryClient();

  const update = useCallback(
    (change: (dashboard: Dashboard) => Dashboard) =>
      queryClient.setQueryData<Dashboard>(dashboardKeys.detail(dashboardId), dashboard => dashboard && change(dashboard)),
    [queryClient, dashboardId]
  );
  const current = useCallback(() => queryClient.getQueryData<Dashboard>(dashboardKeys.detail(dashboardId)), [queryClient, dashboardId]);

  return useMemo(
    () => ({
      async createWidget(json: JsonObject, position: Position): Promise<Widget> {
        const created = await service.createWidget(dashboardId, json, position);
        update(dashboard => withWidget(dashboard, created, position));
        return created;
      },

      async updateWidget(json: JsonObject): Promise<Widget> {
        await service.editWidget(dashboardId, json);
        const widget = widgetFromJson(json);
        update(dashboard => withWidget(dashboard, widget));
        return widget;
      },

      /** Deletes the widget and takes it out of the tabs holding it (v1 `handleDeleteWidget`). */
      async deleteWidget(widget: Widget): Promise<void> {
        await service.deleteWidget(dashboardId, widget.id);
        const dashboard = current();
        const tabs = dashboard ? tabsWithout(dashboard, widget.id) : [];
        await Promise.all(tabs.map(tab => service.editWidget(dashboardId, tab.json)));
        update(next => withoutWidget(next, widget.id));
      },

      async rename(name: string): Promise<void> {
        await service.rename(dashboardId, name);
        update(dashboard => ({ ...dashboard, name }));
      },

      /** Every widget's position, as `layoutToSave` gives them. */
      async savePositions(positions: PositionMap): Promise<void> {
        await service.resizeWidgets(dashboardId, positions);
        update(dashboard => ({ ...dashboard, positions: { ...positions } }));
      },

      /** The whole setting, as stored (`settingJson` with the changes on top). */
      async saveSetting(settingJson: JsonObject): Promise<void> {
        await service.editSetting(dashboardId, settingJson);
        update(dashboard => ({ ...dashboard, setting: new DashboardSetting(settingJson), settingJson }));
      }
    }),
    [service, dashboardId, update, current]
  );
}

export type DashboardEditor = ReturnType<typeof useDashboardEditor>;
