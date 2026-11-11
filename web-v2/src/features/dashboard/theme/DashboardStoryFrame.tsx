import type { CSSProperties, ReactNode } from 'react';
import { DashboardThemeProvider } from './DashboardThemeProvider';
import { getDashboardTheme } from './dashboardThemes';
import './dashboardTheme.css';

interface DashboardStoryFrameProps {
  children: ReactNode;
  /** `setting.theme_name` of the dashboard the story stands in (`light_default`, `light_theme1`, ...). */
  themeName?: string;
  style?: CSSProperties;
}

/**
 * Story-only: what a component gets on the dashboard page. The page's classes carry the theme's CSS variables and the
 * CSS that restyles antd; the provider gives antd the theme's tokens and keeps popups inside the frame.
 */
export function DashboardStoryFrame({ children, themeName = 'light_default', style }: DashboardStoryFrameProps) {
  return (
    <div className="dashboard-theme dashboard-page" data-dashboard-theme={getDashboardTheme(themeName).cssName} style={style}>
      <DashboardThemeProvider themeName={themeName}>{children}</DashboardThemeProvider>
    </div>
  );
}
