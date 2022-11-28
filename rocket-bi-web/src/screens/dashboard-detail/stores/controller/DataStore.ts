/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:00 PM
 */

import { Vue } from 'vue-property-decorator';
import { Inject } from 'typescript-ioc';
import { QueryRequest } from '@core/common/domain/request';
import { DashboardId, Field, MainDateMode, UserProfile, VizSettingType, WidgetId } from '@core/common/domain/model';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { DIException } from '@core/common/domain/exception';
import { DateRange, Status, Stores } from '@/shared';
import { QueryService } from '@core/common/services';
import { VisualizationResponse } from '@core/common/domain/response';

export interface MainDateCompareRequest {
  field: Field;
  currentRange: DateRange | null;
  mainDateMode: MainDateMode | null;
  compareRange: DateRange | null;
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.dataStore })
export class DataStore extends VuexModule {
  readonly PREVIEW_WIDGET_ID = -1;
  chartDataResponses: Record<WidgetId, VisualizationResponse> = {};
  statuses: Record<WidgetId, Status> = {};
  mapErrorMessage: Record<WidgetId, string> = {};
  private dashboardId: DashboardId = -1;
  viewAsUser: UserProfile | null = null;

  ///Những Widget nào sẽ không đc query
  get disableQueryWidgets(): Set<string> {
    return new Set<string>([VizSettingType.InputFilterSetting, VizSettingType.TabMeasurementSetting]);
  }
  @Inject
  private queryService!: QueryService;

  @Action
  async renderChart(payload: { request: QueryRequest; forceFetch: boolean; chartId: number }): Promise<void> {
    const dashboardId = this.dashboardId;
    const viewAsUser = this.viewAsUser;
    const { chartId, forceFetch, request } = payload;
    if (dashboardId) {
      if (forceFetch) {
        return this.fetchWidget({ id: chartId, request: request, viewAsUser: viewAsUser ?? void 0 });
      } else {
        return this.updateWidget({ id: chartId, request: request, viewAsUser: viewAsUser ?? void 0 });
      }
    } else {
      this.setStatusError({ id: chartId, message: "Can't get chart" });
      return Promise.reject(new DIException("Can't get chart"));
    }
  }

  @Action
  query(request: QueryRequest): Promise<VisualizationResponse> {
    return this.queryService.query(request);
  }

  @Action
  queryAsCsv(request: QueryRequest): Promise<string> {
    return this.queryService.queryAsCsv(request);
  }

  @Action
  viewAsQuery(payload: { request: QueryRequest; viewAsUser: UserProfile }): Promise<VisualizationResponse> {
    return this.queryService.viewAsQuery(payload.request, payload.viewAsUser);
  }

  @Mutation
  addData(payload: { id: number; data: VisualizationResponse }) {
    const { id, data } = payload;
    Vue.set(this.chartDataResponses, id, data);
    Vue.set(this.mapErrorMessage, id, '');
  }

  get getChartResponse(): (id: WidgetId) => VisualizationResponse | undefined {
    return id => {
      return this.chartDataResponses[id];
    };
  }

  @Action
  private async fetchWidget(payload: { id: number; request: QueryRequest; viewAsUser?: UserProfile }): Promise<void> {
    const { id, request, viewAsUser } = payload;
    try {
      this.setStatusLoading(id);

      const response = viewAsUser ? await this.viewAsQuery({ request, viewAsUser: viewAsUser }) : await this.query(request);
      this.addData({ id: id, data: response });
      this.setStatusLoaded(id);
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.setStatusError({ id: id, message: exception.message });
    }
  }

  @Action
  private async updateWidget(payload: { id: number; request: QueryRequest; viewAsUser?: UserProfile }): Promise<void> {
    const { id, request, viewAsUser } = payload;
    try {
      this.setStatusUpdating(id);
      const response = viewAsUser ? await this.viewAsQuery({ request, viewAsUser: viewAsUser }) : await this.query(request);
      this.addData({ id: id, data: response });
      this.setStatusLoaded(id);
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.setStatusError({ id: id, message: exception.message });
    }
  }

  @Mutation
  reset() {
    this.chartDataResponses = {};
    this.statuses = {};
    this.mapErrorMessage = {};
    this.dashboardId = -1;
  }

  @Mutation
  setDashboardId(dashboardId: number) {
    this.dashboardId = dashboardId;
  }

  @Mutation
  setStatusError(payload: { id: number; message: string }) {
    const { id, message } = payload;
    Vue.set(this.statuses, id, Status.Error);
    Vue.set(this.mapErrorMessage, id, message);
  }

  @Mutation
  setStatusLoading(chartId: number) {
    Vue.set(this.statuses, chartId, Status.Loading);
  }

  @Mutation
  setStatusLoaded(chartId: number) {
    Vue.set(this.statuses, chartId, Status.Loaded);
  }

  @Mutation
  setStatusRendering(chartId: number) {
    Vue.set(this.statuses, chartId, Status.Rendering);
  }

  @Mutation
  setStatusRendered(chartId: number) {
    Vue.set(this.statuses, chartId, Status.Rendered);
  }

  @Mutation
  setStatusUpdating(chartId: number) {
    Vue.set(this.statuses, chartId, Status.Updating);
  }

  @Mutation
  refresh(chartId: number) {
    if (Status.Loaded) {
      Vue.set(this.statuses, chartId, Status.Updating);
      Vue.set(this.statuses, chartId, Status.Loaded);
    }
  }

  @Mutation
  setViewAsUser(viewAsUser: UserProfile) {
    this.viewAsUser = viewAsUser;
  }

  @Mutation
  resetViewAsUser() {
    this.viewAsUser = null;
  }
}

export const _ChartStore: DataStore = getModule(DataStore);
