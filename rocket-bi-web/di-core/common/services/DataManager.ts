import { Dashboard, DashboardId, DashboardSetting, DynamicFilter, FieldDetailInfo, Organization, UserInfo, UserProfile, Widget } from '@core/common/domain';
import { CookieManger } from '@core/common/services/index';
import { JsonUtils, Log } from '@core/utils';
import { SessionInfo } from '@core/common/domain/response';
import { BuilderMode, OauthType } from '@/shared';
import router from '@/router/Router';
import { RouterUtils } from '@/utils/RouterUtils';
import { MainDateData } from '@/screens/dashboard-detail/stores';
import { Di } from '@core/common/modules';

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
  SelectedColumns = 'selected_columns',
  Organization = 'organization'
}

export class DataManager {
  static readonly DEFAULT_MAX_AGE = 2592000;
  private static readonly TEST_ACCOUNT = 'bot@datainsider.co';

  static getCookieManger(): CookieManger {
    return Di.get(CookieManger);
  }

  static saveCurrentDashboardId(dashboardId: string): boolean {
    sessionStorage.setItem(DataManagerKeys.DashboardId, dashboardId);
    return true;
  }

  static getCurrentDashboardId(): string | undefined {
    return sessionStorage.getItem(DataManagerKeys.DashboardId) || void 0;
  }

  static removeCurrentDashboardId(): boolean {
    sessionStorage.removeItem(DataManagerKeys.DashboardId);
    return true;
  }

  static saveSession(session: SessionInfo): boolean {
    const maxAgeInSecond = session.maxAge ?? DataManager.DEFAULT_MAX_AGE;
    return this.getCookieManger().putMaxAge(DataManagerKeys.SessionId, session.value, maxAgeInSecond);
  }

  static getSession(): string | undefined {
    return this.getCookieManger().get(DataManagerKeys.SessionId);
  }

  static removeSession(): boolean {
    return this.getCookieManger().remove(DataManagerKeys.SessionId);
  }

  static saveUserProfile(profile: UserProfile) {
    localStorage.setItem(DataManagerKeys.UserProfile, JSON.stringify(profile));
    return true;
  }

  static getUserProfile(): UserProfile | any {
    const rawUserProfile = localStorage.getItem(DataManagerKeys.UserProfile);
    if (rawUserProfile) return UserProfile.fromObject(JSON.parse(rawUserProfile));
    else return void 0;
  }

  static saveUserInfo(userInfo: UserInfo): boolean {
    localStorage.setItem(DataManagerKeys.UserInfo, JSON.stringify(userInfo));
    return true;
  }

  static getUserInfo(): UserInfo | undefined {
    const raw = localStorage.getItem(DataManagerKeys.UserInfo);
    if (raw) {
      return UserInfo.fromObject(JSON.parse(raw));
    } else {
      return void 0;
    }
  }

  static clearUserData(): boolean {
    localStorage.removeItem(DataManagerKeys.UserProfile);
    localStorage.removeItem(DataManagerKeys.UserInfo);
    localStorage.removeItem(DataManagerKeys.LoginType);
    return true;
  }

  static saveCurrentWidget(widget: Widget): boolean {
    sessionStorage.setItem(DataManagerKeys.Widget, JsonUtils.toJson(widget));
    return true;
  }

  static getCurrentWidget(): Widget | undefined {
    const raw = sessionStorage.getItem(DataManagerKeys.Widget);
    if (raw) {
      return Widget.fromObject(JsonUtils.fromObject(raw));
    } else {
      return void 0;
    }
  }

  static removeCurrentWidget(): boolean {
    sessionStorage.removeItem(DataManagerKeys.Widget);
    return true;
  }

  static saveChartBuilderMode(mode: BuilderMode): boolean {
    sessionStorage.setItem(DataManagerKeys.ChartBuilderMode, mode.valueOf().toString());
    return true;
  }

  static getChartBuilderMode(): BuilderMode {
    const mode = sessionStorage.getItem(DataManagerKeys.ChartBuilderMode);
    if (mode) {
      return mode as BuilderMode;
    } else {
      return BuilderMode.Create;
    }
  }

  static removeChartBuilderMode(): boolean {
    sessionStorage.removeItem(DataManagerKeys.ChartBuilderMode);
    return true;
  }

  static getToken(): string | null {
    return RouterUtils.getToken(router.currentRoute);
  }

  static saveUserProfileConfigColumns(configColumns: FieldDetailInfo[]): boolean {
    localStorage.setItem(DataManagerKeys.UserProfileConfigColumns, JsonUtils.toJson(configColumns));
    return true;
  }

  static getUserProfileConfigColumns(): FieldDetailInfo[] {
    const json: string | null = localStorage.getItem(DataManagerKeys.UserProfileConfigColumns);
    if (json) {
      const columnsAsObjects: any[] = JsonUtils.fromObject<any[]>(json);
      return columnsAsObjects.map(column => FieldDetailInfo.fromObject(column) as FieldDetailInfo);
    }
    return [];
  }

  static saveMainFilters(id: string, filters: DynamicFilter[]): boolean {
    const json: string = JsonUtils.toJson(filters);
    const key = this.buildKey([DataManagerKeys.DynamicFilters, id]);
    localStorage.setItem(key, json);
    return true;
  }

  static getMainFilters(id: string): DynamicFilter[] {
    const key = this.buildKey([DataManagerKeys.DynamicFilters, id]);
    const json: string | null = localStorage.getItem(key);
    if (json) {
      const filterAsObjects: any[] = JsonUtils.fromObject<any[]>(json);
      return filterAsObjects.map(filter => DynamicFilter.fromObject(filter));
    } else {
      return [];
    }
  }

  static getDatabaseSelected(dashboardId: number): string | undefined {
    const key = this.buildKey([DataManagerKeys.DbSelected, dashboardId]);
    return localStorage.getItem(key) ?? void 0;
  }

  static saveDatabaseSelected(dashboardId: number, dbName: string): boolean {
    const key = this.buildKey([DataManagerKeys.DbSelected, dashboardId]);
    localStorage.setItem(key, dbName);
    return true;
  }

  static saveMainDateData(dashboardId: DashboardId, data: MainDateData): boolean {
    const key = this.buildKey([DataManagerKeys.MainFilterMode, dashboardId]);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  }

  static getMainDateData(dashboardId: DashboardId): MainDateData | undefined {
    const key = this.buildKey([DataManagerKeys.MainFilterMode, dashboardId]);
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    } else {
      return void 0;
    }
  }

  static getDashboardSetting(id: DashboardId): DashboardSetting | undefined {
    const key = this.buildKey([DataManagerKeys.DashboardSetting, id]);
    const value: string | null = localStorage.getItem(key);
    if (value) {
      const obj: any = JSON.parse(value);
      return DashboardSetting.fromObject(obj);
    }
  }

  static saveDashboardSetting(id: DashboardId, setting: DashboardSetting): void {
    const key = this.buildKey([DataManagerKeys.DashboardSetting, id]);
    const settingAsString = JSON.stringify(setting);
    localStorage.setItem(key, settingAsString);
  }

  // save current dashboard to sessionStorage storage
  static saveCurrentDashboard(dashboard: Dashboard): void {
    const dashboardAsString = JSON.stringify(dashboard);
    sessionStorage.setItem(DataManagerKeys.Dashboard, dashboardAsString);
  }

  static getCurrentDashboard(): Dashboard | undefined {
    const dashboardAsString: string | null = sessionStorage.getItem(DataManagerKeys.Dashboard);
    if (dashboardAsString) {
      return Dashboard.fromObject(JSON.parse(dashboardAsString));
    }
  }

  // Input is array ['key1', 'key2', 'key3']
  // Output: 'key1_key2_key3,...'
  private static buildKey(data: any[]) {
    return data.join('_');
  }

  static setLoginType(loginType: OauthType) {
    localStorage.setItem(DataManagerKeys.LoginType, loginType.toString());
  }

  static getLoginType(): OauthType {
    const value = localStorage.getItem(DataManagerKeys.LoginType);
    if (value) {
      return value as OauthType;
    } else {
      return OauthType.DEFAULT;
    }
  }

  static getOrganization(): Organization | null {
    try {
      const value = localStorage.getItem(DataManagerKeys.Organization);
      if (value) {
        return Organization.fromObject(JSON.parse(value));
      } else {
        return null;
      }
    } catch (ex) {
      Log.error('DataManagerService.getOrganization failed', ex);
      return null;
    }
  }

  static saveOrganization(organization: Organization) {
    const newOrganization = Organization.fromObject(organization);
    newOrganization.expiredTimeMs = Date.now() + 86400000; // expired in 1 days
    localStorage.setItem(DataManagerKeys.Organization, JSON.stringify(newOrganization));
  }

  static clearLocalStorage() {
    localStorage.clear();
  }

  static isTestAccount(): boolean {
    return this.getUserProfile()?.email === DataManager.TEST_ACCOUNT;
  }
}
