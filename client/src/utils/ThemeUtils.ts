/*
 * @author: tvc12 - Thien Vi
 * @created: 8/20/21, 3:46 PM
 */

import { _ThemeStore, DiTheme } from '@/store/modules/ThemeStore';
import { UserProfile } from '@core/domain';
import { get } from 'lodash';
import { DashboardThemeType } from '@core/domain/Model/Dashboard/Setting/DashboardThemeType';

export class ThemeUtils {
  static THEME_KEY = 'diTheme';
  static LOCAL_STORAGE_KEY = 'di_theme';

  // fixme: force light theme
  static getMainTheme(): DiTheme {
    return 'light';
    // const themeData = ThemeUtils.getThemeData();
    // if (themeData && ThemeUtils.isValidThemeName(themeData[ThemeUtils.THEME_KEY])) {
    //   return themeData[ThemeUtils.THEME_KEY];
    // } else {
    //   return 'light';
    // }
  }

  static saveMainTheme(themeName: DiTheme) {
    if (ThemeUtils.isValidThemeName(themeName)) {
      localStorage.setItem(
        ThemeUtils.LOCAL_STORAGE_KEY,
        JSON.stringify({
          [ThemeUtils.THEME_KEY]: themeName
        })
      );
    }
  }

  /**
   * FIXME:Can't get from data manager.
   * Can fix it by move data manager to static
   */
  static getThemeData() {
    const themeAsString = localStorage.getItem(ThemeUtils.LOCAL_STORAGE_KEY);
    if (themeAsString) {
      return JSON.parse(themeAsString);
    }
  }
  // fixme: force light theme
  static getThemeName(userProfile: UserProfile): DiTheme {
    // const themeName = get(userProfile.properties, ThemeUtils.THEME_KEY, 'light');
    // if (this.isValidThemeName(themeName)) {
    //   return themeName;
    // } else {
    //   return 'light';
    // }
    return 'light';
  }

  static isValidThemeName(theme: string): theme is DiTheme {
    return theme === 'dark' || theme === 'light';
  }

  static getDefaultThemeName() {
    return _ThemeStore.isDarkTheme ? DashboardThemeType.Default : DashboardThemeType.LightDefault;
  }
}
