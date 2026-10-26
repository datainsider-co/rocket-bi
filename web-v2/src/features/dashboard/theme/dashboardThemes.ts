/** v1 `DashboardThemeType`: the values of `setting.theme_name`. */
export const DashboardThemeType = {
  Default: 'dark_default',
  Theme1: 'dark_theme1',
  Theme2: 'dark_theme2',
  Theme3: 'dark_theme3',
  Theme4: 'dark_theme4',
  LightDefault: 'light_default',
  LightTheme1: 'light_theme1',
  LightTheme2: 'light_theme2',
  LightTheme3: 'light_theme3',
  LightTheme4: 'light_theme4'
} as const;

export type DashboardThemeType = (typeof DashboardThemeType)[keyof typeof DashboardThemeType];

export interface DashboardTheme {
  /** Value of `data-dashboard-theme`, which picks the variables in `dashboardTheme.css`. */
  cssName: string;
  /** Default series colors. */
  colors: readonly string[];
}

const LIGHT_COLORS = ['#28ABAA', '#4DCF36', '#EA6B6B', '#75ABEA', '#2CC5DC', '#FF7AAF', '#C247C2', '#2CA10F', '#E38007', '#FFD422'];
const DARK_COLORS = ['#45C7C6', '#88F874', '#F78686', '#96BEED', '#ABEEEE', '#FF6FA9', '#FF87FF', '#4BD828', '#FF9D24', '#FFF022'];

/** v1 `screens/dashboard-detail/theme/DashboardTheme.json` (`defaultSettings` belong to the theme picker, not here). */
export const DASHBOARD_THEMES: Readonly<Record<DashboardThemeType, DashboardTheme>> = {
  light_default: { cssName: 'light-default', colors: LIGHT_COLORS },
  light_theme1: { cssName: 'anzac', colors: LIGHT_COLORS },
  light_theme2: { cssName: 'electric-violet', colors: LIGHT_COLORS },
  light_theme3: { cssName: 'curious-blue', colors: LIGHT_COLORS },
  light_theme4: { cssName: 'ebony-clay', colors: LIGHT_COLORS },
  dark_default: { cssName: 'dark-default', colors: LIGHT_COLORS },
  dark_theme1: { cssName: 'clear-sky', colors: DARK_COLORS },
  dark_theme2: { cssName: 'deep-sea-space', colors: DARK_COLORS },
  dark_theme3: { cssName: 'lawrencium', colors: ['#06C2EB', ...DARK_COLORS.slice(1)] },
  dark_theme4: { cssName: 'dark', colors: LIGHT_COLORS }
};

/** Unknown names fall back to the light default; v1 used the app's light/dark mode, v2 always starts light. */
export function getDashboardTheme(themeName: string): DashboardTheme {
  return DASHBOARD_THEMES[themeName as DashboardThemeType] ?? DASHBOARD_THEMES.light_default;
}
