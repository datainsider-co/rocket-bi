/* eslint-disable @typescript-eslint/no-use-before-define */
import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared/enums/Stores';
import { DashboardThemeType } from '@core/common/domain/model/dashboard/setting/DashboardThemeType';
import { ColorUtils } from '@/utils/ColorUtils';
import { Log } from '@core/utils/Log';

export type DiTheme = 'light' | 'dark' | 'custom';

export interface ThemeInfo {
  name: string;
  style: any;
  colors: string[];
  baseTheme: DiTheme;
  /**
   * contains default settings of dashboard
   */
  defaultSettings: any;
}

@Module({ store: store, name: Stores.ThemeStore, dynamic: true, namespaced: true })
class ThemeStore extends VuexModule {
  protected static readonly DASHBOARD_THEME_AS_MAP: {
    [key in DashboardThemeType]: ThemeInfo;
  } = require('@/screens/dashboard-detail/theme/DashboardTheme.json');
  private allowApplyMainTheme = true;

  currentThemeName: DiTheme = 'light';
  mainThemeName: DiTheme = 'light';
  paletteColors: string[] = ThemeStore.DASHBOARD_THEME_AS_MAP[DashboardThemeType.LightDefault].colors;
  static readonly ATTRIBUTE_THEME_NAME = 'dashboard-theme';
  dashboardTheme = '';

  protected minColor = ColorUtils.getColorFromCssVariable('var(--min-background-color)');
  protected maxColor = ColorUtils.getColorFromCssVariable('var(--max-background-color)');

  get baseDashboardTheme(): string {
    return ColorUtils.combine(this.minColor, [this.maxColor]);
  }

  get getTheme(): (themeName: string) => ThemeInfo {
    return (themeName: string) => {
      return ThemeStore.DASHBOARD_THEME_AS_MAP[themeName as DashboardThemeType] ?? ThemeStore.DASHBOARD_THEME_AS_MAP[DashboardThemeType.Default];
    };
  }

  get isDarkTheme(): boolean {
    return this.currentThemeName === 'dark';
  }

  @Mutation
  setDashboardTheme(themeName: DashboardThemeType) {
    if (this.dashboardTheme !== themeName) {
      const theme: ThemeInfo = ThemeStore.DASHBOARD_THEME_AS_MAP[themeName] ?? ThemeStore.DASHBOARD_THEME_AS_MAP[DashboardThemeType.Default];
      this.dashboardTheme = themeName;
      this.paletteColors = theme.colors;
      document.body.setAttribute(ThemeStore.ATTRIBUTE_THEME_NAME, theme.name);
      this.minColor = ColorUtils.getColorFromCssVariable('var(--min-background-color)');
      this.maxColor = ColorUtils.getColorFromCssVariable('var(--max-background-color)');
      if (theme.baseTheme !== this.currentThemeName) {
        this.currentThemeName = theme.baseTheme;
      }
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
    _ThemeStore.setAllowApplyMainTheme(true);
    _ThemeStore.setTheme(_ThemeStore.mainThemeName);
  }
}

export const _ThemeStore: ThemeStore = getModule(ThemeStore);
