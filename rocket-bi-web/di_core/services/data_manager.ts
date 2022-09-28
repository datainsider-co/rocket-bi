import { Dashboard, DashboardId, DashboardSetting, DynamicFilter, FieldDetailInfo, FilterWidget, UserInfo, UserProfile, Widget } from '@core/domain';
import { CookieManger } from '@core/services';
import { JsonUtils, Log } from '@core/utils';
import { SessionInfo } from '@core/domain/Response';
import { Inject } from 'typescript-ioc';
import { BuilderMode, OauthType } from '@/shared';
import { isNumber } from 'lodash';
import router from '@/router/router';
import { RouterUtils } from '@/utils/RouterUtils';
import { MainDateData } from '@/screens/DashboardDetail/stores';

// don't edit value
enum DataManagerKeys {
  UserInfo = 'user_info',
  UserProfile = 'user_profile',
  SessionId = 'ssid',
  DashboardId = 'dashboard_id',
  Widget = 'widget',
  ChartBuilderMode = 'chart_builder_mode',
  Token = 'token',
  Filters = 'filters_of_dashboard',
  UserProfileConfigColumns = 'user_profile_config_columns',
  DynamicFilters = 'dynamic_filters',
  DbSelected = 'db_selected',
  MainFilterMode = 'main_filter_mode',
  // MainDatabase = 'db_highest_used',
  DashboardSetting = 'dashboard_setting',
  LoginType = 'login_type',
  Dashboard = 'dashboard',
  SelectedColumns = 'selected_columns'
}

export class DataManager {
  static readonly DEFAULT_MAX_AGE = 2592000;
  @Inject
  private cookieManger!: CookieManger;

  saveCurrentDashboardId(dashboardId: string): boolean {
    sessionStorage.setItem(DataManagerKeys.DashboardId, dashboardId);
    return true;
  }

  getCurrentDashboardId(): string | undefined {
    return sessionStorage.getItem(DataManagerKeys.DashboardId) || void 0;
  }

  removeCurrentDashboardId(): boolean {
    sessionStorage.removeItem(DataManagerKeys.DashboardId);
    return true;
  }

  saveSession(session: SessionInfo): boolean {
    const maxAgeInSecond = session.maxAge ?? DataManager.DEFAULT_MAX_AGE;
    return this.cookieManger.putMaxAge(DataManagerKeys.SessionId, session.value, maxAgeInSecond);
  }

  getSession(): string | undefined {
    return this.cookieManger.get(DataManagerKeys.SessionId);
  }

  removeSession(): boolean {
    return this.cookieManger.remove(DataManagerKeys.SessionId);
  }

  saveUserProfile(profile: UserProfile) {
    localStorage.setItem(DataManagerKeys.UserProfile, JSON.stringify(profile));
    return true;
  }

  //TODO: Enhance JSON Parser
  getUserProfile(): UserProfile | any {
    const rawUserProfile = localStorage.getItem(DataManagerKeys.UserProfile);
    if (rawUserProfile) return JSON.parse(rawUserProfile);
    else return void 0;
  }

  saveUserInfo(userInfo: UserInfo): boolean {
    localStorage.setItem(DataManagerKeys.UserInfo, JsonUtils.toJson(userInfo));
    return true;
  }

  //TODO: Enhance JSON Parser
  getUserInfo(): UserInfo | undefined {
    const raw = localStorage.getItem(DataManagerKeys.UserInfo);
    if (raw) {
      return JsonUtils.fromObject(raw);
    } else {
      return void 0;
    }
  }

  clearUserData(): boolean {
    localStorage.removeItem(DataManagerKeys.UserProfile);
    localStorage.removeItem(DataManagerKeys.UserInfo);
    localStorage.removeItem(DataManagerKeys.LoginType);
    return true;
  }

  saveCurrentWidget(widget: Widget): boolean {
    sessionStorage.setItem(DataManagerKeys.Widget, JsonUtils.toJson(widget));
    return true;
  }

  getCurrentWidget(): Widget | undefined {
    const raw = sessionStorage.getItem(DataManagerKeys.Widget);
    if (raw) {
      return Widget.fromObject(JsonUtils.fromObject(raw));
    } else {
      return void 0;
    }
  }

  removeCurrentWidget(): boolean {
    sessionStorage.removeItem(DataManagerKeys.Widget);
    return true;
  }

  saveChartBuilderMode(mode: BuilderMode): boolean {
    sessionStorage.setItem(DataManagerKeys.ChartBuilderMode, mode.valueOf().toString());
    return true;
  }

  getChartBuilderMode(): BuilderMode {
    const mode = sessionStorage.getItem(DataManagerKeys.ChartBuilderMode);
    if (mode) {
      return mode as BuilderMode;
    } else {
      return BuilderMode.Create;
    }
  }

  removeChartBuilderMode(): boolean {
    sessionStorage.removeItem(DataManagerKeys.ChartBuilderMode);
    return true;
  }

  getToken(): string | null {
    return RouterUtils.getToken(router.currentRoute);
  }

  saveFilters(id: DashboardId, filters: FilterWidget[]): boolean {
    if (isNumber(id) && id > -1) {
      const json: string = JsonUtils.toJson(filters);
      localStorage.setItem(this.buildKey([DataManagerKeys.Filters, id]), json);
      return true;
    } else {
      return false;
    }
  }

  getFilters(id: DashboardId): FilterWidget[] {
    const json: string | null = localStorage.getItem(this.buildKey([DataManagerKeys.Filters, id]));
    if (json) {
      const filtersAsObjects: any[] = JsonUtils.fromObject<any[]>(json);
      return filtersAsObjects.map(filter => Widget.fromObject(filter) as FilterWidget);
    } else {
      return [];
    }
  }

  removeFilters(id: DashboardId): boolean {
    localStorage.removeItem(this.buildKey([DataManagerKeys.Filters, id]));
    return true;
  }

  saveUserProfileConfigColumns(configColumns: FieldDetailInfo[]): boolean {
    localStorage.setItem(DataManagerKeys.UserProfileConfigColumns, JsonUtils.toJson(configColumns));
    return true;
  }

  getUserProfileConfigColumns(): FieldDetailInfo[] {
    const json: string | null = localStorage.getItem(DataManagerKeys.UserProfileConfigColumns);
    if (json) {
      const columnsAsObjects: any[] = JsonUtils.fromObject<any[]>(json);
      return columnsAsObjects.map(column => FieldDetailInfo.fromObject(column) as FieldDetailInfo);
    }
    return [];
  }

  saveMainFilters(id: string, filters: DynamicFilter[]): boolean {
    const json: string = JsonUtils.toJson(filters);
    const key = this.buildKey([DataManagerKeys.DynamicFilters, id]);
    localStorage.setItem(key, json);
    return true;
  }

  getMainFilters(id: string): DynamicFilter[] {
    const key = this.buildKey([DataManagerKeys.DynamicFilters, id]);
    const json: string | null = localStorage.getItem(key);
    if (json) {
      const filterAsObjects: any[] = JsonUtils.fromObject<any[]>(json);
      return filterAsObjects.map(filter => DynamicFilter.fromObject(filter));
    } else {
      return [];
    }
  }

  getDatabaseSelected(dashboardId: number): string | undefined {
    const key = this.buildKey([DataManagerKeys.DbSelected, dashboardId]);
    return localStorage.getItem(key) ?? void 0;
  }

  saveDatabaseSelected(dashboardId: number, dbName: string): boolean {
    const key = this.buildKey([DataManagerKeys.DbSelected, dashboardId]);
    localStorage.setItem(key, dbName);
    return true;
  }

  saveMainDateData(dashboardId: DashboardId, data: MainDateData): boolean {
    const key = this.buildKey([DataManagerKeys.MainFilterMode, dashboardId]);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  }

  getMainDateData(dashboardId: DashboardId): MainDateData | undefined {
    const key = this.buildKey([DataManagerKeys.MainFilterMode, dashboardId]);
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    } else {
      return void 0;
    }
  }

  getDashboardSetting(id: DashboardId): DashboardSetting | undefined {
    const key = this.buildKey([DataManagerKeys.DashboardSetting, id]);
    const value: string | null = localStorage.getItem(key);
    if (value) {
      const obj: any = JSON.parse(value);
      return DashboardSetting.fromObject(obj);
    }
  }

  saveDashboardSetting(id: DashboardId, setting: DashboardSetting): void {
    const key = this.buildKey([DataManagerKeys.DashboardSetting, id]);
    const settingAsString = JSON.stringify(setting);
    localStorage.setItem(key, settingAsString);
  }

  // save current dashboard to sessionStorage storage
  saveCurrentDashboard(dashboard: Dashboard): void {
    const dashboardAsString = JSON.stringify(dashboard);
    sessionStorage.setItem(DataManagerKeys.Dashboard, dashboardAsString);
  }

  getCurrentDashboard(): Dashboard | undefined {
    const dashboardAsString: string | null = sessionStorage.getItem(DataManagerKeys.Dashboard);
    if (dashboardAsString) {
      return Dashboard.fromObject(JSON.parse(dashboardAsString));
    }
  }

  // Input is array ['key1', 'key2', 'key3']
  // Output: 'key1_key2_key3,...'
  private buildKey(data: any[]) {
    return data.join('_');
  }

  setLoginType(loginType: OauthType) {
    localStorage.setItem(DataManagerKeys.LoginType, loginType.toString());
  }

  getLoginType(): OauthType {
    const value = localStorage.getItem(DataManagerKeys.LoginType);
    if (value) {
      return value as OauthType;
    } else {
      return OauthType.DEFAULT;
    }
  }

  getSelectedColumnNames(): string[] | null {
    const value = localStorage.getItem(DataManagerKeys.SelectedColumns);
    if (value) {
      return JSON.parse(value);
    } else {
      return null;
    }
  }

  saveSelectedColumnNames(columnNames: string[]) {
    localStorage.setItem(DataManagerKeys.SelectedColumns, JSON.stringify(columnNames));
  }

  clearLocalStorage() {
    localStorage.clear();
  }
}
