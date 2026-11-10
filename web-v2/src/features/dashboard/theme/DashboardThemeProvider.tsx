import { useMemo, type ReactNode } from 'react';
import { App, ConfigProvider } from 'antd';
import { dashboardAntdTheme } from './dashboardAntdTheme';
import { dashboardPopupContainer } from './popupContainer';
import './dashboardAntd.css';

interface DashboardThemeProviderProps {
  /** `setting.theme_name`; unknown while the dashboard loads. */
  themeName?: string;
  children: ReactNode;
}

const NO_ARROW = { arrow: false };

/**
 * antd on the dashboard page (v1 set the theme on `<body>`): the theme's accent, and every popup and dialog rendered
 * inside the page, where the theme's CSS variables are. Its own `App`, so `App.useApp()` below gives messages and
 * confirms with this theme. Goes above whatever calls `App.useApp()` for the page.
 */
export function DashboardThemeProvider({ themeName = '', children }: DashboardThemeProviderProps) {
  const theme = useMemo(() => dashboardAntdTheme(themeName), [themeName]);
  return (
    <ConfigProvider theme={theme} getPopupContainer={dashboardPopupContainer} popover={NO_ARROW}>
      <App component={false}>{children}</App>
    </ConfigProvider>
  );
}
