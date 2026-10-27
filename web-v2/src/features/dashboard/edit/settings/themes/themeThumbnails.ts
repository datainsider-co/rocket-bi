import type { DashboardThemeType } from '../../../theme/dashboardThemes';
import darkDefault from './dark_default.png';
import darkTheme1 from './dark_theme1.png';
import darkTheme2 from './dark_theme2.png';
import darkTheme3 from './dark_theme3.png';
import darkTheme4 from './dark_theme4.png';
import lightDefault from './light_default.png';
import lightTheme1 from './light_theme1.png';
import lightTheme2 from './light_theme2.png';
import lightTheme3 from './light_theme3.png';
import lightTheme4 from './light_theme4.png';

/** v1 `assets/icon/dashboard/theme/<theme>.png`: a small picture of a dashboard in each theme. */
export const THEME_THUMBNAILS: Readonly<Record<DashboardThemeType, string>> = {
  light_default: lightDefault,
  light_theme1: lightTheme1,
  light_theme2: lightTheme2,
  light_theme3: lightTheme3,
  light_theme4: lightTheme4,
  dark_default: darkDefault,
  dark_theme1: darkTheme1,
  dark_theme2: darkTheme2,
  dark_theme3: darkTheme3,
  dark_theme4: darkTheme4
};
