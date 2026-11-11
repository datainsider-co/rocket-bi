import { useCallback, useState, type ReactNode } from 'react';
import { App, ConfigProvider } from 'antd';
import { dashboardAntdTheme } from '@/features/dashboard/theme/dashboardAntdTheme';
import '@/features/dashboard/theme/dashboardTheme.css';
import '@/features/dashboard/theme/dashboardAntd.css';
import './builderScope.css';

const THEME = dashboardAntdTheme('light_default');
const NO_ARROW = { arrow: false };

/**
 * Where ChartBuilder renders (v1 `[builder-default-style]`): the default light look and accent whatever the dashboard's
 * theme, on a dashboard or off one (Data Cook, the query editor). A layer over the screen that holds the builder's
 * dialogs and every popup they open, so those take the same variables and antd tokens. Its own `App`, for confirms.
 */
export function BuilderScope({ children }: { children: ReactNode }) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const getPopupContainer = useCallback(() => layer ?? document.body, [layer]);
  return (
    <div ref={setLayer} className="dashboard-theme dashboard-page builder-scope" data-dashboard-theme="light-default" builder-default-style="">
      <ConfigProvider theme={THEME} getPopupContainer={getPopupContainer} popover={NO_ARROW}>
        <App component={false}>{children}</App>
      </ConfigProvider>
    </div>
  );
}
