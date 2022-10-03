import { Dashboard, DashboardId, DashboardSetting, DIMap, DirectoryId, MainDateFilter, Position, Widget, WidgetId } from '@core/common/domain/model';
import { CreateDashboardRequest, CreateQueryRequest, ListDrillThroughDashboardRequest } from '@core/common/domain/request';
import { BaseClient } from '@core/common/services/HttpClient';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import { PageResult, PermissionTokenResponse } from '@core/common/domain/response';
import { Log } from '@core/utils';

export abstract class DashboardRepository {
  abstract get(id: DashboardId): Promise<Dashboard>;

  abstract getDirectoryId(dashboardId: DashboardId): Promise<DirectoryId>;

  abstract create(request: CreateDashboardRequest | CreateQueryRequest): Promise<Dashboard>;

  abstract rename(id: DashboardId, toName: string): Promise<boolean>;

  abstract delete(id: DashboardId): Promise<boolean>;

  abstract getWidget(id: DashboardId, widgetId: WidgetId): Promise<Widget>;

  abstract createWidget(dashboardId: DashboardId, widget: Widget, position: Position): Promise<Widget>;

  abstract editWidget(dashboardId: DashboardId, widgetId: WidgetId, widget: Widget): Promise<boolean>;

  abstract resizeWidgets(dashboardId: DashboardId, positions: DIMap<Position>): Promise<boolean>;

  abstract deleteWidget(dashboardId: DashboardId, widgetId: WidgetId): Promise<boolean>;

  abstract editMainDateFilter(dashboardId: DashboardId, mainDateFilter: MainDateFilter): Promise<boolean>;

  abstract removeMainDateFilter(dashboardId: DashboardId): Promise<boolean>;

  abstract share(dashboardId: DashboardId): Promise<PermissionTokenResponse>;

  abstract editSetting(dashboardId: DashboardId, setting: DashboardSetting): Promise<DashboardSetting>;

  abstract listDrillThroughDashboards(request: ListDrillThroughDashboardRequest): Promise<PageResult<Dashboard>>;

  abstract refresh(dashboardId: DashboardId): Promise<boolean>;

  abstract edit(id: DashboardId, dashboard: Dashboard): Promise<Dashboard>;
}

export class DashboardRepositoryImpl extends DashboardRepository {
  @InjectValue(DIKeys.BiClient)
  private httpClient!: BaseClient;

  get(id: DashboardId): Promise<Dashboard> {
    return this.httpClient.get<Dashboard>(`/dashboards/${id}`).then(item => Dashboard.fromObject(item));
  }

  create(request: CreateDashboardRequest | CreateQueryRequest): Promise<Dashboard> {
    return this.httpClient.post<Dashboard>(`/dashboards/create`, request).then(item => Dashboard.fromObject(item));
  }

  rename(id: DashboardId, toName: string): Promise<boolean> {
    return this.httpClient
      .put(`/dashboards/${id}/rename`, {
        toName: toName
      })
      .then(_ => true);
  }

  delete(id: DashboardId): Promise<boolean> {
    return this.httpClient.delete(`/dashboards/${id}`).then(_ => true);
  }

  getWidget(id: DashboardId, widgetId: WidgetId): Promise<Widget> {
    return this.httpClient.get(`/dashboards/${id}/widgets/${widgetId}`).then(item => Widget.fromObject(item));
  }

  createWidget(dashboardId: DashboardId, widget: Widget, position: Position): Promise<Widget> {
    Log.debug('createWidget', widget);
    return this.httpClient
      .post<Widget>(`/dashboards/${dashboardId}/widgets/create`, {
        widget: widget,
        position: position
      })
      .then(item => Widget.fromObject(item));
  }

  editWidget(dashboardId: DashboardId, widgetId: WidgetId, widget: Widget): Promise<boolean> {
    return this.httpClient
      .put(`/dashboards/${dashboardId}/widgets/${widgetId}/edit`, {
        dashboardId: dashboardId,
        widgetId: widgetId,
        widget: widget
      })
      .then(_ => true);
  }

  resizeWidgets(dashboardId: DashboardId, positions: DIMap<Position>): Promise<boolean> {
    return this.httpClient
      .put(`/dashboards/${dashboardId}/widgets/resize`, {
        positions: positions
      })
      .then(_ => true);
  }

  deleteWidget(dashboardId: DashboardId, widgetId: WidgetId): Promise<boolean> {
    return this.httpClient.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`).then(_ => true);
  }

  editMainDateFilter(dashboardId: DashboardId, mainDateFilter: MainDateFilter): Promise<boolean> {
    return this.httpClient.put(`/dashboards/${dashboardId}/main_date_filter/edit`, { mainDateFilter: mainDateFilter }).then(_ => true);
  }

  removeMainDateFilter(dashboardId: DashboardId): Promise<boolean> {
    return this.httpClient.put(`/dashboards/${dashboardId}/main_date_filter/edit`, { mainDateFilter: null }).then(_ => true);
  }

  share(dashboardId: DashboardId): Promise<PermissionTokenResponse> {
    return this.httpClient.post<PermissionTokenResponse>(`/dashboards/${dashboardId}/share`, { actions: ['view'] });
  }

  editSetting(dashboardId: DashboardId, setting: DashboardSetting): Promise<DashboardSetting> {
    return this.httpClient
      .put(`/dashboards/${dashboardId}`, {
        setting: setting
      })
      .then(_ => setting);
  }

  getDirectoryId(dashboardId: DashboardId): Promise<DirectoryId> {
    return this.httpClient.get(`dashboards/${dashboardId}/get_directory_id`);
  }

  listDrillThroughDashboards(request: ListDrillThroughDashboardRequest): Promise<PageResult<Dashboard>> {
    return this.httpClient.post(`dashboards/list_drill_through`, request);
  }

  refresh(dashboardId: DashboardId): Promise<boolean> {
    return this.httpClient.post(`/dashboards/${dashboardId}/refresh_boost`).then(_ => true);
  }

  edit(id: DashboardId, dashboard: Dashboard): Promise<Dashboard> {
    return this.httpClient.put<Dashboard>(`/dashboards/${id}`, dashboard).then(item => Dashboard.fromObject(item));
  }
}
