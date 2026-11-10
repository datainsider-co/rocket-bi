import { useEffect } from 'react';

const THEME_CLASS = 'dashboard-theme';

/**
 * Puts the dashboard's theme on `<body>` while its page is open, as v1 did (`body[dashboard-theme]`): what is drawn
 * around the page, the app header first, takes the theme's variables (`dashboardTheme.css`).
 */
export function useBodyDashboardTheme(cssName: string): void {
  useEffect(() => {
    const { body } = document;
    body.classList.add(THEME_CLASS);
    body.dataset.dashboardTheme = cssName;
    return () => {
      body.classList.remove(THEME_CLASS);
      delete body.dataset.dashboardTheme;
    };
  }, [cssName]);
}
