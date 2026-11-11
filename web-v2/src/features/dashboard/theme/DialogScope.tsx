import { useCallback, useState, type HTMLAttributes, type ReactNode } from 'react';
import { App, ConfigProvider } from 'antd';
import { dashboardAntdTheme } from './dashboardAntdTheme';
import './dashboardTheme.css';
import './dashboardAntd.css';
import './dialogScope.css';

const THEME = dashboardAntdTheme('light_default');
const NO_ARROW = { arrow: false };

interface DialogScopeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Where the dashboard's dialogs render: the default light look and accent whatever the dashboard's theme. v1's modals
 * were outside `#app`, which the theme's variables were scoped to, so a dialog on an Anzac dashboard was still blue.
 * A layer over the screen that holds the dialogs and every popup they open, so those take the same variables and antd
 * tokens. Its own `App`, for confirms.
 */
export function DialogScope({ children, className = '', ...attributes }: DialogScopeProps) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const getPopupContainer = useCallback(() => layer ?? document.body, [layer]);
  return (
    <div ref={setLayer} className={`dashboard-theme dashboard-page dialog-scope ${className}`} data-dashboard-theme="light-default" {...attributes}>
      <ConfigProvider theme={THEME} getPopupContainer={getPopupContainer} popover={NO_ARROW}>
        <App component={false}>{children}</App>
      </ConfigProvider>
    </div>
  );
}
