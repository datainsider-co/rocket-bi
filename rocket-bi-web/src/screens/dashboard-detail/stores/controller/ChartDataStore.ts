/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:00 PM
 */

import { Vue } from 'vue-property-decorator';
import { Inject } from 'typescript-ioc';
import { ExportType, QueryRequest } from '@core/common/domain/request';
import { Field, MainDateMode, UserProfile, WidgetId } from '@core/common/domain/model';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { DIException } from '@core/common/domain/exception';
import { DateRange, Status, Stores } from '@/shared';
import { QueryService } from '@core/common/services';
import { VisualizationResponse } from '@core/common/domain/response';
import { cloneDeep } from 'lodash';

export interface MainDateCompareRequest {
  field: Field;
  currentRange: DateRange | null;
  mainDateMode: MainDateMode | null;
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.ChartDataStore })
export class ChartDataStore extends VuexModule {
  chartDataResponses: Record<WidgetId, VisualizationResponse> = {};
  statuses: Record<WidgetId, Status> = {};
  mapErrorMessage: Record<WidgetId, string> = {};
  viewAsUser: UserProfile | null = null;

  @Inject
  private queryService!: QueryService;

  @Action
  async handleQueryAndRenderChart(payload: { request: QueryRequest; isForceFetch: boolean; chartId: number }): Promise<void> {
    const { chartId, isForceFetch, request } = payload;
    try {
      isForceFetch ? this.setStatusLoading(chartId) : this.setStatusUpdating(chartId);
      const response = await this.query(request);
      this.setVisualizationResponse({ id: chartId, data: response });
      this.setStatusLoaded(chartId);
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.setStatusError({ id: chartId, message: exception.message });
    }
  }

  @Action
  public query(request: QueryRequest): Promise<VisualizationResponse> {
    if (this.viewAsUser) {
      return this.queryService.viewAsQuery(request, this.viewAsUser);
    } else {
      return this.queryService.query(request);
    }
  }

  @Action
  export(payload: { request: QueryRequest; type: ExportType }): Promise<Blob> {
    return this.queryService.export(payload.request, payload.type);
  }

  @Mutation
  setVisualizationResponse(payload: { id: number; data: VisualizationResponse }) {
    const { id, data } = payload;
    Vue.set(this.chartDataResponses, id, data);
    Vue.set(this.mapErrorMessage, id, '');
  }

  get getVisualizationResponse(): (id: WidgetId) => VisualizationResponse | undefined {
    return id => {
      return this.chartDataResponses[id];
    };
  }

  @Mutation
  reset() {
    this.chartDataResponses = {};
    this.statuses = {};
    this.mapErrorMessage = {};
    this.viewAsUser = null;
  }

  @Mutation
  setStatusError(payload: { id: number; message: string }) {
    const { id, message } = payload;
    Vue.set(this.statuses, id, Status.Error);
    Vue.set(this.mapErrorMessage, id, message);
  }

  @Mutation
  setStatuses(payload: { ids: WidgetId[]; status: Status; errorMsg?: string }): void {
    const statuses = cloneDeep(this.statuses);
    const errorMap = cloneDeep(this.mapErrorMessage);
    const { ids, status, errorMsg } = payload;
    ids.forEach(id => {
      statuses[id] = status;
      if (errorMsg) {
        errorMap[id] = errorMsg;
      }
    });
    this.statuses = statuses;
    this.mapErrorMessage = errorMap;
  }

  @Mutation
  setStatusLoading(chartId: number) {
    if (this.statuses[chartId] !== Status.Loading) {
      Vue.set(this.statuses, chartId, Status.Loading);
    }
  }

  @Mutation
  setStatusLoaded(chartId: number) {
    if (this.statuses[chartId] !== Status.Loaded) {
      Vue.set(this.statuses, chartId, Status.Loaded);
    }
  }

  @Mutation
  setStatusUpdating(chartId: number) {
    if (this.statuses[chartId] !== Status.Loaded) {
      Vue.set(this.statuses, chartId, Status.Updating);
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

export const ChartDataModule: ChartDataStore = getModule(ChartDataStore);
