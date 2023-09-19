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
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ChartInfoUtils, ListUtils } from '@/utils';
import { ThemeUtils } from '@/utils/ThemeUtils';
import {
  BoostInfo,
  ChartControl,
  ChartInfo,
  Dashboard,
  DashboardId,
  DashboardSetting,
  DIException,
  DIMap,
  Directory,
  DirectoryId,
  ImageWidget,
  MainDateFilter2,
  MainDateMode,
  Position,
  ValueControlType,
  Widget
} from '@core/common/domain';
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
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';

export interface MainDateData {
  mode: MainDateMode;
  chosenDateRange?: DateRange | null;
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.DashboardStore })
export class DashboardStore extends VuexModule {
  dashboardTitle = 'Untitled';
  dashboardStatus: Status = Status.Loading;
  errorMessage = '';
  mainDateFilter: MainDateFilter2 | null = null;
  previousPage: Route | null = null;
  ownerId: string | null = null;
  // setting: DashboardSetting = DashboardSetting.default();
  dashboardId?: DashboardId = void 0;
  // TODO: avoid undefine
  currentDashboard: Dashboard | null = null;
  currentDirectory: Directory | null = null;

  // for copy widget future
  copiedData: CopiedData | null = null;

  @Inject
  private readonly dashboardService!: DashboardService;

  @Inject
  private readonly directoryService!: DirectoryService;

  @Inject
  private readonly uploadService!: UploadService;

  @Inject
  private readonly trackingService!: TrackingService;

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

  /**
   * list all enable chart control in dashboard
   */
  get chartControls(): ChartControl[] {
    const chartControls: ChartControl[] = WidgetModule.widgets.filter(widget => {
      return !ChartInfoUtils.isInnerFilterById(widget.id) && ChartControl.isChartControl(widget) && widget.isEnableControl();
    }) as any;
    if (this.mainDateFilter && this.mainDateFilter.isEnableControl()) {
      return [this.mainDateFilter, ...chartControls];
    } else {
      return chartControls;
    }
  }

  /**
   * get chart control by id.
   * @return ChartControl if found and it's enable, otherwise return undefined
   */
  get getChartControl(): (controlId: number) => ChartControl | undefined {
    return (controlId: number) => this.chartControls.find(controller => controller.getControlId() === controlId);
  }

  get mainDateFilterMode(): MainDateMode {
    return this.mainDateFilter?.mode ?? MainDateMode.allTime;
  }

  get setting(): DashboardSetting {
    if (this.currentDashboard && this.currentDashboard.setting) {
      return this.currentDashboard.setting;
    } else {
      const defaultSetting = DashboardSetting.default();
      // override default background color to default if not found
      defaultSetting.background.color = 'var(--default-dashboard-background-color)';
      defaultSetting.border.colorOpacity = 10;
      return defaultSetting;
    }
  }

  @Action
  private async handleError(ex: DIException): Promise<void> {
    switch (ex.reason) {
      case ApiExceptions.unauthorized:
        this.showError("You don't have permission to view dashboard");
        break;
      case ApiExceptions.notFound:
        await router.replace({ name: Routers.AllData });
        break;
      default:
        this.showError('Load dashboard error!');
    }
  }

  @Action({ rawError: true })
  async init(id: DashboardId): Promise<void> {
    try {
      this.setDashboardId(id);
      this.setDashboardStatus(Status.Loading);
      const dashboard: Dashboard = await this.dashboardService.get(id);
      this.setOwner(dashboard.ownerId);
      await this.processDashboardData(dashboard);
      this.setDashboardStatus(Status.Loaded);
    } catch (ex) {
      Log.trace('handleLoadDashboard::trace', ex);
      await this.handleError(ex);
    }
  }

  @Mutation
  private setOwner(ownerId: string): void {
    this.ownerId = ownerId;
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
  private setDashboardTitle(title: string): void {
    this.dashboardTitle = title;
    if (this.currentDashboard) {
      this.currentDashboard.name = title;
    }
  }

  @Mutation
  setPreviousPage(page: Route) {
    this.previousPage = page;
  }

  @Mutation
  setMainDateFilter(mainDateFilter: MainDateFilter2 | null) {
    this.mainDateFilter = mainDateFilter;
  }

  @Mutation
  reset() {
    this.dashboardId = undefined;
    this.dashboardStatus = Status.Loading;
    this.dashboardTitle = 'Untitled';
    this.errorMessage = '';
    this.mainDateFilter = null;
    this.ownerId = null;
    this.currentDashboard = null;
    this.currentDirectory = null;
  }

  @Mutation
  private setDashboardStatus(status: Status): void {
    this.dashboardStatus = status;
  }

  @Action
  saveMainDate(newMainDateData: MainDateData): void {
    if (this.id) {
      DataManager.saveMainDateData(this.id, newMainDateData);
    }
  }

  @Mutation
  private setDashboardSetting(setting: DashboardSetting): void {
    // this.setting = setting;
    if (this.currentDashboard) {
      this.currentDashboard.setting = setting;
    }
    _ThemeStore.setDashboardTheme(setting.themeName);
  }

  @Mutation
  loadThemeFromLocal(id: DashboardId): void {
    const setting: DashboardSetting | undefined = DataManager.getDashboardSetting(id);
    const themeName = setting?.themeName ?? ThemeUtils.getDefaultThemeName();
    _ThemeStore.setDashboardTheme(themeName);
  }

  @Action
  async loadDirectory(id: DashboardId): Promise<void> {
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
    this.setDashboard(dashboard);
    this.setDashboardSetting(dashboard.setting);
    this.setDashboardTitle(dashboard.name);
    DataManager.saveDashboardSetting(dashboard.id, dashboard.setting);
    await FilterModule.loadLocalFilters(dashboard.id);
    WidgetModule.setWidgets(dashboard.widgets || []);
    WidgetModule.setMapPosition(dashboard.widgetPositions || []);
    await QuerySettingModule.init(WidgetModule.allQueryWidgets);
    await this.loadMainDateFilter(dashboard);
  }

  @Mutation
  private setDashboardId(id: DashboardId): void {
    this.dashboardId = id;
  }

  @Action
  private async loadMainDateFilter(dashboard: Dashboard): Promise<void> {
    if (dashboard.setting.mainDateFilter || dashboard.mainDateFilter) {
      const mainDateFilter: MainDateFilter2 = dashboard.setting.mainDateFilter ?? MainDateFilter2.fromMainDateFilter(dashboard.mainDateFilter!);
      const localMainDateData: MainDateData | undefined = DataManager.getMainDateData(dashboard.id);
      const newDateFilter = mainDateFilter.copyWith({ mode: localMainDateData?.mode });
      const data: MainDateData = {
        mode: newDateFilter.mode,
        chosenDateRange: localMainDateData?.chosenDateRange
      };
      FilterModule.loadDateRange(data);
      this.setMainDateFilter(newDateFilter);

      if (mainDateFilter && mainDateFilter.isEnableControl() && mainDateFilter.getValueController().isEnableControl()) {
        const controller = mainDateFilter.getValueController();
        const valueMap: Map<ValueControlType, string[]> | undefined = controller.getDefaultValueMapWithDateData(data);
        await QuerySettingModule.setDynamicValues({
          id: mainDateFilter.getControlId(),
          valueMap: valueMap
        });
      }
    }
  }

  @Mutation
  private setDashboard(dashboard: Dashboard): void {
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
  async updateMainDateFilter(newMainDataFilter?: MainDateFilter2 | null): Promise<void> {
    try {
      const newSetting: DashboardSetting = this.setting.withMainDateFilter(newMainDataFilter);
      await this.saveSetting(newSetting);
    } catch (ex) {
      Log.error('updateMainDateFilter::', ex);
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
