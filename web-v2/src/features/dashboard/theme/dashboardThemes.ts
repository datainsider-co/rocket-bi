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
  /** `--accent` of the theme as a hex: antd derives its primary palette from it, which a CSS variable cannot give. */
  accent: string;
  /** Default series colors. */
  colors: readonly string[];
}

const LIGHT_COLORS = ['#28ABAA', '#4DCF36', '#EA6B6B', '#75ABEA', '#2CC5DC', '#FF7AAF', '#C247C2', '#2CA10F', '#E38007', '#FFD422'];
const DARK_COLORS = ['#45C7C6', '#88F874', '#F78686', '#96BEED', '#ABEEEE', '#FF6FA9', '#FF87FF', '#4BD828', '#FF9D24', '#FFF022'];

/** v1 `screens/dashboard-detail/theme/DashboardTheme.json` (`defaultSettings` belong to the theme picker, not here). */
export const DASHBOARD_THEMES: Readonly<Record<DashboardThemeType, DashboardTheme>> = {
  light_default: { cssName: 'light-default', accent: '#597fff', colors: LIGHT_COLORS },
  light_theme1: { cssName: 'anzac', accent: '#e3a845', colors: LIGHT_COLORS },
  light_theme2: { cssName: 'electric-violet', accent: '#a51adf', colors: LIGHT_COLORS },
  light_theme3: { cssName: 'curious-blue', accent: '#1a86df', colors: LIGHT_COLORS },
  light_theme4: { cssName: 'ebony-clay', accent: '#222e38', colors: LIGHT_COLORS },
  dark_default: { cssName: 'dark-default', accent: '#597fff', colors: LIGHT_COLORS },
  dark_theme1: { cssName: 'clear-sky', accent: '#597fff', colors: DARK_COLORS },
  dark_theme2: { cssName: 'deep-sea-space', accent: '#597fff', colors: DARK_COLORS },
  dark_theme3: { cssName: 'lawrencium', accent: '#597fff', colors: ['#06C2EB', ...DARK_COLORS.slice(1)] },
  dark_theme4: { cssName: 'dark', accent: '#597fff', colors: LIGHT_COLORS }
};

/** Unknown names fall back to the light default; v1 used the app's light/dark mode, v2 always starts light. */
export function getDashboardTheme(themeName: string): DashboardTheme {
  return DASHBOARD_THEMES[themeName as DashboardThemeType] ?? DASHBOARD_THEMES.light_default;
}
