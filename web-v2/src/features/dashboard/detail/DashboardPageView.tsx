import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Result, Spin, Typography } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { DashboardControlsProvider } from '../controls/DashboardControlsContext';
import { ResetFiltersButton } from '../controls/ResetFiltersButton';
import { getDashboardTheme } from '../theme/dashboardThemes';
import { DashboardCanvas } from './DashboardCanvas';
import '../theme/dashboardTheme.css';
import './DashboardPage.css';

export interface DashboardPageViewProps {
  dashboard?: Dashboard;
  isLoading: boolean;
  error?: string;
  mobile: boolean;
  onRetry: () => void;
  onBack: () => void;
}

function Body({ dashboard, isLoading, error, mobile, onRetry }: DashboardPageViewProps) {
  if (isLoading) return <Spin className="flex! h-full items-center justify-center" />;
  if (error || !dashboard) {
    return (
      <Result
        status="warning"
        title={error ?? 'Load dashboard error!'}
        extra={
          <Button type="primary" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }
  return <DashboardCanvas dashboard={dashboard} mobile={mobile} />;
}

/**
 * `/dashboard/:name` in view mode (v1 `DashboardDetail.vue`): header with back and title, then the dashboard. The
 * theme's CSS variables are scoped to this page, where v1 set them on `<body>`.
 */
export function DashboardPageView(props: DashboardPageViewProps) {
  const { dashboard, onBack } = props;
  const theme = getDashboardTheme(dashboard?.setting.themeName ?? '');

  const page = (
    <div className="dashboard-theme dashboard-page" data-dashboard-theme={theme.cssName}>
      <header className="dashboard-page__header flex items-center gap-2">
        <Button type="text" icon={<ArrowLeftOutlined />} aria-label="Back" onClick={onBack} />
        <Typography.Title level={4} className="m-0! min-w-0 flex-1 truncate" style={{ color: 'var(--text-color)' }} title={dashboard?.name}>
          {dashboard?.name ?? ''}
        </Typography.Title>
        {dashboard && <ResetFiltersButton />}
      </header>
      <div className="dashboard-page__body">
        <Body {...props} />
      </div>
    </div>
  );
  // A new dashboard starts from its own filter defaults.
  return dashboard ? (
    <DashboardControlsProvider key={dashboard.id} widgets={dashboard.widgets}>
      {page}
    </DashboardControlsProvider>
  ) : (
    page
  );
}
