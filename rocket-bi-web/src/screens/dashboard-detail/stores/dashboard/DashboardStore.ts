/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 4:57 PM
 */

import router from '@/router/Router';
import { DashboardControllerModule, FilterModule, QuerySettingModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { TimeScheduler } from '@/shared/components/common/scheduler/scheduler-time/TimeScheduler';
import { ApiExceptions, DateRange, Status, Stores } from '@/shared';
import { Routers } from '@/shared/enums/Routers';
import store from '@/store';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ListUtils } from '@/utils';
import { ThemeUtils } from '@/utils/ThemeUtils';
import {
  BoostInfo,
  ChartInfo,
  Dashboard,
  DashboardId,
  DashboardSetting,
  DIException,
  DIMap,
  Directory,
  DirectoryId,
  FieldRelatedCondition,
  FilterRequest,
  ImageWidget,
  MainDateFilter,
  MainDateMode,
  Position,
  Widget
} from '@core/common/domain';
import { Di } from '@core/common/modules';
import { DashboardService, DataManager, DirectoryService, UploadService } from '@core/common/services';
import { DashboardAction } from '@core/tracking/domain/TrackingDataType';
import { TrackingService } from '@core/tracking/service/TrackingService';
import { Log, WidgetUtils } from '@core/utils';
import { Properties } from 'di-web-analytics/dist/domain';
import { Inject } from 'typescript-ioc';
import { Route } from 'vue-router';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { CopiedData } from '@/screens/dashboard-detail/intefaces/CopiedData';
import { cloneDeep } from 'lodash';
import { AuthenticationModule, AuthenticationStore } from '@/store/modules/AuthenticationStore';

export interface MainDateData {
  mode: MainDateMode;
  chosenDateRange?: DateRange | null;
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.DashboardStore })
export class DashboardStore extends VuexModule {
  previousPage: Route | null = null;
  dashboardTitle = 'Untitled';
  dashboardStatus: Status = Status.Loading;
  errorMessage = '';
  mainDateFilter: MainDateFilter | null = null;
  mainDateFilterMode: MainDateMode = MainDateMode.allTime;
  myDataPage: Route | null = null;
  ownerId: string | null = null;
  setting: DashboardSetting = DashboardSetting.default();
  private dashboardId?: DashboardId = void 0;
  // TODO: avoid undefine
  currentDashboard: Dashboard | null = null;
  currentDirectory: Directory | null = null;

  // for copy widget future
  copiedData: CopiedData | null = null;

  @Inject
  private dashboardService!: DashboardService;

  @Inject
  private directoryService!: DirectoryService;

  @Inject
  private uploadService!: UploadService;

  @Inject
  private trackingService!: TrackingService;

  get title() {
    return this.dashboardTitle || 'Untitled';
  }

  // id nay la id cua dashboard hien tai, neu context hien tai khong phai dashboard thi se ra undefined
  get id() {
    return this.dashboardId;
  }

  get positions(): DIMap<Position> {
    return WidgetModule.mapPosition || {};
  }

  get widgetAsMap(): DIMap<Widget> {
    return WidgetModule.widgetAsMap;
  }

  get hasWidget(): boolean {
    const allWidgetInDashboard = WidgetModule.widgets.filter(widget => {
      if (ChartInfo.isChartInfo(widget)) {
        return widget.id !== -1 && widget.id !== -2;
      }
      return true;
    });
    return ListUtils.isNotEmpty(allWidgetInDashboard);
  }

  get databaseNames(): string[] {
    if (ListUtils.isEmpty(WidgetModule.allQueryWidgets)) {
      return [];
    } else {
      return WidgetUtils.getDatabaseNames(WidgetModule.allQueryWidgets);
    }
  }

  get databaseUniqueNames(): string[] {
    if (ListUtils.isEmpty(this.databaseNames)) {
      return [];
    } else {
      return Array.from(new Set(this.databaseNames).values());
    }
  }

  get mainDatabase(): string | null {
    return WidgetUtils.getMainDatabase(WidgetModule.allQueryWidgets);
  }

  get mainTables(): string[] {
    const mainDb = this.mainDatabase;
    return mainDb ? WidgetUtils.getMainTables(WidgetModule.allQueryWidgets, mainDb) : [];
  }

  get isOwner(): boolean {
    return AuthenticationModule.userProfile.username == this.ownerId;
  }

  get isUseBoost(): boolean {
    return this.currentDashboard?.useBoost ?? false;
  }

  @Action
  handleError(ex: DIException) {
    switch (ex.reason) {
      case ApiExceptions.unauthorized:
        this.showError("You don't have permission to view dashboard");
        break;
      case ApiExceptions.notFound:
        return router.replace({ name: Routers.AllData });
      default:
        this.showError('Load dashboard error!');
    }
  }

  @Action({ rawError: true })
  async handleLoadDashboard(id: DashboardId): Promise<void> {
    const startTime: number = Date.now();
    try {
      this.setDashboardId(id);
      this.setDashboardStatus(Status.Loading);
      const dashboard = await this.dashboardService.get(id);
      this.saveOwnerId({ ownerId: dashboard.ownerId });
      await this.processDashboardData(dashboard);
      this.setDashboardStatus(Status.Loaded);
      // await this.loadDirectoryFromDashboardId(id);
      this.trackingService.trackDashboard({
        action: DashboardAction.View,
        dashboardId: dashboard.id,
        dashboardName: dashboard.name,
        extraProperties: {
          di_duration: Date.now() - startTime,
          di_start_time: startTime
        }
      });
    } catch (ex) {
      Log.error('handleLoadDashboard::ex', ex);
      Log.trace('handleLoadDashboard::trace', ex);
      this.trackingService.trackDashboard({
        action: DashboardAction.View,
        dashboardId: id,
        isError: true,
        extraProperties: {
          di_duration: Date.now() - startTime,
          di_start_time: startTime
        }
      });
      await this.handleError(ex);
    }
  }

  @Mutation
  saveOwnerId(payload: { ownerId: string }) {
    this.ownerId = payload.ownerId;
  }

  @Action
  async handleEditMainDateFilter(newMainDateFilter: MainDateFilter): Promise<void> {
    if (this.id) {
      await this.dashboardService.editMainDateFilter(this.id, newMainDateFilter);
    } else {
      this.showError(`dashboard.store.ts::handleUploadMainDateFilter::dashboardId::${this.id}`);
    }
  }

  @Action
  async handleRemoveMainDateFilter(id: DashboardId): Promise<boolean> {
    if (id) {
      return this.dashboardService.removeMainDateFilter(id);
    } else {
      throw new DIException(`Dashboard id not found ${id}`);
    }
  }

  @Action
  handleUpdateImage(file: File): Promise<ImageWidget> {
    //TODO: show loading when uploading
    return this.uploadService
      .upload(file)
      .then(response => ImageWidget.fromUrl(response.data))
      .catch(ex => {
        Log.error('uploadImage::', ex);
        return ex;
      });
  }

  @Action({ rawError: true })
  async handleRenameDashboard(newName: string): Promise<void> {
    if (this.id) {
      try {
        const result: boolean = await this.dashboardService.rename(this.id, newName);
        if (result) {
          this.setDashboardTitle(newName);
          this.trackingService.trackDashboard({
            action: DashboardAction.Rename,
            dashboardId: this.id || 0,
            dashboardName: this.dashboardTitle,
            isError: false,
            extraProperties: { dashboardNewName: newName } as Properties
          });
        } else {
          throw new DIException('Rename failure, try again');
        }
      } catch (ex) {
        this.trackingService.trackDashboard({
          action: DashboardAction.Rename,
          dashboardId: this.id || 0,
          dashboardName: this.dashboardTitle,
          isError: true,
          extraProperties: { dashboardNewName: newName } as Properties
        });
        return Promise.reject(ex);
      }
    } else {
      return Promise.reject(new DIException('Can not rename this dashboard'));
    }
  }

  @Mutation
  showError(errorMessage: string) {
    Log.debug('errorMessage::', errorMessage);
    this.dashboardStatus = Status.Error;
    this.errorMessage = errorMessage;
  }

  @Mutation
  setDashboardTitle(title: string) {
    this.dashboardTitle = title;
    if (this.currentDashboard) {
      this.currentDashboard.name = title;
    }
  }

  @Mutation
  setPreviousPage(payload: Route) {
    this.previousPage = payload;
  }

  @Mutation
  setMyDataPage(payload: Route) {
    this.myDataPage = payload;
  }

  @Mutation
  setMainDateFilter(mainDateFilter: MainDateFilter | null) {
    this.mainDateFilter = mainDateFilter;
  }

  @Mutation
  setMainDateFilterMode(mode: MainDateMode) {
    this.mainDateFilterMode = mode;
  }

  @Mutation
  reset() {
    this.dashboardId = undefined;
    this.dashboardStatus = Status.Loading;
    this.dashboardTitle = 'Untitled';
    this.errorMessage = '';
    this.mainDateFilter = null;
    this.mainDateFilterMode = MainDateMode.allTime;
    this.ownerId = null;
    this.setting = DashboardSetting.default();
    this.currentDashboard = null;
    this.currentDirectory = null;
  }

  @Mutation
  setDashboardStatus(status: Status) {
    this.dashboardStatus = status;
  }

  @Action
  saveMainDateFilterMode(payload: MainDateData) {
    if (this.id) {
      DataManager.saveMainDateData(this.id, payload);
    }
  }

  @Mutation
  setDashboardSetting(setting: DashboardSetting) {
    this.setting = setting;
    _ThemeStore.setDashboardTheme(setting.themeName);
  }

  @Mutation
  loadThemeFromLocal(id: DashboardId): void {
    const setting = DataManager.getDashboardSetting(id);
    const themeName = setting?.themeName ?? ThemeUtils.getDefaultThemeName();
    _ThemeStore.setDashboardTheme(themeName);
  }

  @Action
  async loadDirectoryFromDashboardId(id: DashboardId): Promise<void> {
    const directoryId = await this.dashboardService.getDirectoryId(id);
    const directory = await this.directoryService.get(directoryId);
    this.setDirectory(directory);
  }

  @Mutation
  private setDirectory(directory: Directory): void {
    this.currentDirectory = directory;
  }

  @Action
  private async processDashboardData(dashboard: Dashboard): Promise<void> {
    this.setCurrentDashboard(dashboard);
    this.setDashboardTitle(dashboard.name);
    this.setDashboardSetting(dashboard.setting);
    DataManager.saveDashboardSetting(dashboard.id, dashboard.setting);
    await this.loadMainDateFilterMode(dashboard);
    FilterModule.loadLocalMainFilters(dashboard);
    WidgetModule.setWidgets(dashboard.widgets || []);
    WidgetModule.setMapPosition(dashboard.widgetPositions || []);
    QuerySettingModule.saveQuerySetting(WidgetModule.allQueryWidgets);
    await GeolocationModule.loadGeolocationMap();
  }

  @Mutation
  private setDashboardId(id: DashboardId) {
    this.dashboardId = id;
  }

  @Action
  private loadMainDateFilterMode(dashboard: Dashboard) {
    if (dashboard.mainDateFilter) {
      this.setMainDateFilter(dashboard.mainDateFilter);
      const data = DataManager.getMainDateData(dashboard.id);
      if (data) {
        FilterModule.loadDateRangeFilter(data);
        this.setMainDateFilterMode(data.mode);
      }
    }
  }

  @Mutation
  setCurrentDashboard(dashboard: Dashboard) {
    this.currentDashboard = dashboard;
  }

  @Action
  async saveSetting(newSetting: DashboardSetting): Promise<void> {
    this.setDashboardSetting(newSetting);
    if (this.id) {
      await this.dashboardService.editSetting(this.id, newSetting);
      DataManager.saveDashboardSetting(this.id, newSetting);
    }
  }

  @Action
  getDirectoryId(dashboardId: DashboardId): Promise<DirectoryId> {
    return this.dashboardService.getDirectoryId(dashboardId);
  }

  @Action
  async forceRefresh(): Promise<boolean> {
    if (this.id) {
      return await this.dashboardService.refresh(this.id);
    } else {
      Log.error('Dashboard Not Found!');
      return Promise.reject('Dashboard Not Found!');
    }
  }

  @Action
  async updateBoostInfo(info: BoostInfo) {
    if (this.currentDashboard) {
      this.setBoostInfo(info);
      const boostInfo = info.copyWith(TimeScheduler.toSchedulerV2(info.scheduleTime));
      await this.dashboardService.edit(this.currentDashboard.id, this.currentDashboard.copyWith(boostInfo));
    } else {
      throw new DIException('Dashboard Not Found!');
    }
  }

  @Mutation
  setBoostInfo(info: BoostInfo) {
    this.currentDashboard!.boostInfo = info;
  }

  @Action
  async updateMainDateFilter(payload: { mainDateFilter: FilterRequest | null; mode: MainDateMode | null }) {
    try {
      const { mainDateFilter, mode } = payload;
      if (this.currentDashboard) {
        this.setMainDateFilterRequest({ request: mainDateFilter, mainDateMode: mode });
        await this.dashboardService.edit(this.currentDashboard.id, this.currentDashboard);
      }
    } catch (ex) {
      Log.error(ex);
    }
  }

  @Mutation
  setMainDateFilterRequest(payload: { request: FilterRequest | null; mainDateMode: MainDateMode | null }) {
    const { request, mainDateMode } = payload;
    if (this.currentDashboard?.mainDateFilter) {
      this.currentDashboard.mainDateFilter.filterRequest = request ?? void 0;
    } else if (this.currentDashboard) {
      const mainDateFilter = request && mainDateMode ? new MainDateFilter((request.condition as FieldRelatedCondition).field, mainDateMode, request) : void 0;
      this.currentDashboard!.mainDateFilter = mainDateFilter;
    }
  }

  @Action
  async handleUpdateDashboard(dashboard: Dashboard) {
    try {
      await this.dashboardService.edit(dashboard.id, dashboard);
      this.setCurrentDashboard(dashboard);
    } catch (ex) {
      Log.error(ex);
    }
  }

  @Action
  async addNewChart(payload: { chartInfo: ChartInfo; position?: Position }) {
    const { chartInfo, position } = payload;
    const currentPosition: Position = position || chartInfo.getDefaultPosition();
    const newChartInfo = (await WidgetModule.handleCreateNewWidget({
      widget: chartInfo,
      position: currentPosition
    })) as ChartInfo;
    WidgetModule.handleDeleteSnapWidget();
    WidgetModule.addWidget({ widget: newChartInfo, position: currentPosition });
    QuerySettingModule.setQuerySetting({ id: newChartInfo.id, query: newChartInfo.setting });
    FilterModule.initAffectFilterWidgets([newChartInfo]);
    await FilterModule.addFilterWidget(chartInfo);
    await DashboardControllerModule.renderChart({ id: newChartInfo.id, forceFetch: true });
  }

  @Mutation
  setCopiedData(copiedData: CopiedData | null) {
    if (copiedData) {
      this.copiedData = cloneDeep(copiedData);
    } else {
      this.copiedData = null;
    }
  }
}

export const DashboardModule: DashboardStore = getModule(DashboardStore);
