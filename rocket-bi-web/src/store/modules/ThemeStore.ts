/* eslint-disable @typescript-eslint/no-use-before-define */
import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared/enums/Stores';
import { DashboardThemeType } from '@core/common/domain/model/dashboard/setting/DashboardThemeType';
import { ColorUtils } from '@/utils/ColorUtils';
import { Log } from '@core/utils/Log';

export type DiTheme = 'light' | 'dark' | 'custom';

@Module({ store: store, name: Stores.themeStore, dynamic: true, namespaced: true })
class ThemeStore extends VuexModule {
  private static readonly DASHBOARD_THEME_AS_MAP = require('@/screens/dashboard-detail/theme/DashboardTheme.json');
  private allowApplyMainTheme = true;

  currentThemeName: DiTheme = 'light';
  mainThemeName: DiTheme = 'light';
  dashboardStyle: any = ThemeStore.DASHBOARD_THEME_AS_MAP[DashboardThemeType.LightDefault].style;
  paletteColors: string[] = ThemeStore.DASHBOARD_THEME_AS_MAP[DashboardThemeType.LightDefault].colors;
  static readonly ATTRIBUTE_THEME_NAME = 'dashboard-theme';
  dashboardTheme = '';

  get baseDashboardTheme(): string {
    return ColorUtils.combine(this.dashboardStyle['--min-background-color'], [this.dashboardStyle['--max-background-color']]);
  }

  get isDarkTheme(): boolean {
    return this.currentThemeName === 'dark';
  }

  @Mutation
  setDashboardTheme(themeName: DashboardThemeType) {
    const dashboardTheme: any = ThemeStore.DASHBOARD_THEME_AS_MAP[themeName] ?? ThemeStore.DASHBOARD_THEME_AS_MAP[DashboardThemeType.Default];
    this.dashboardTheme = themeName;
    this.dashboardStyle = dashboardTheme.style;
    this.paletteColors = dashboardTheme.colors;
    document.body.setAttribute(ThemeStore.ATTRIBUTE_THEME_NAME, dashboardTheme.name);
    const isNeedUpdateBaseTheme = dashboardTheme['base-theme'] !== _ThemeStore.currentThemeName;
    if (isNeedUpdateBaseTheme) {
      _ThemeStore.setTheme(dashboardTheme['base-theme']);
    }
  }

  @Mutation
  clearDashboardStyle() {
    document.body.removeAttribute(ThemeStore.ATTRIBUTE_THEME_NAME);
  }

  @Mutation
  applyMainTheme(payload: { themeName: DiTheme; force?: boolean }) {
    const { themeName, force } = payload;
    this.mainThemeName = themeName;
    if (this.allowApplyMainTheme || force) {
      _ThemeStore.setTheme(this.mainThemeName);
    }
  }

  @Mutation
  setAllowApplyMainTheme(isAllow: boolean) {
    this.allowApplyMainTheme = isAllow;
  }

  @Mutation
  setTheme(themeName: DiTheme) {
    this.currentThemeName = themeName;
  }

  @Mutation
  revertToMainTheme() {
    Log.debug('_ThemeStore.mainThemeName::', _ThemeStore.mainThemeName);
    _ThemeStore.setAllowApplyMainTheme(true);
    _ThemeStore.setTheme(_ThemeStore.mainThemeName);
  }
}

export const _ThemeStore: ThemeStore = getModule(ThemeStore);
