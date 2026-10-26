import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Result, Spin, Typography } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { InternalFilter } from '@/core/query/internalFilter';
import { DashboardPermissionsProvider } from '../access/DashboardPermissionsContext';
import { PasswordGateView } from '../access/PasswordGateView';
import type { DashboardAccess } from '../access/useDashboardAccess';
import { DashboardControlsProvider } from '../controls/DashboardControlsContext';
import { HeaderFilterBar } from '../controls/header-filters/HeaderFilterBar';
import { MainDateFilter } from '../controls/MainDateFilter';
import { ResetFiltersButton } from '../controls/ResetFiltersButton';
import { DashboardMode } from '../mode/dashboardMode.utils';
import { DashboardModeView } from '../mode/DashboardModeView';
import type { DashboardDisplay } from '../mode/useDashboardDisplay';
import { getDashboardTheme } from '../theme/dashboardThemes';
import type { ViewAs } from '../view-as/useViewAs';
import { ViewAsBarView } from '../view-as/ViewAsBarView';
import { ViewAsProvider } from '../view-as/ViewAsContext';
import { ViewAsModal } from '../view-as/ViewAsModal';
import { DashboardCanvas } from './DashboardCanvas';
import '../theme/dashboardTheme.css';
import './DashboardPage.css';

export interface DashboardLoad {
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}

export interface DashboardLayout {
  mobile: boolean;
  /** `/embedded/dashboard/:name` (v1 `EmbeddedDashboard`): the dashboard alone, with its title and date filter. */
  embedded: boolean;
}

export interface DashboardPageViewProps {
  dashboard?: Dashboard;
  /** The filters the URL opened the dashboard with (`?filters=`). */
  headerFilters?: readonly InternalFilter[];
  load: DashboardLoad;
  access: DashboardAccess;
  display: DashboardDisplay;
  viewAs: ViewAs;
  layout: DashboardLayout;
  onBack: () => void;
}

function Body({ dashboard, load, access, viewAs, layout, onBack }: DashboardPageViewProps) {
  if (load.isLoading || (dashboard && access.lock === 'checking')) return <Spin className="flex! h-full items-center justify-center" />;
  if (load.error || !dashboard) {
    return (
      <Result
        status="warning"
        title={load.error ?? 'Load dashboard error!'}
        extra={
          <Button type="primary" onClick={load.onRetry}>
            Retry
          </Button>
        }
      />
    );
  }
  // Nothing is queried until the password is given.
  if (access.lock === 'locked') return <PasswordGateView onUnlock={access.onUnlock} onCancel={onBack} />;
  return (
    <DashboardPermissionsProvider permissions={access.permissions}>
      <ViewAsProvider user={viewAs.user}>
        <DashboardCanvas dashboard={dashboard} mobile={layout.mobile} />
      </ViewAsProvider>
    </DashboardPermissionsProvider>
  );
}

/**
 * `/dashboard/:name` in view mode (v1 `DashboardDetail.vue`): header with back, title and options, the header filters
 * (not on mobile, like v1), then the dashboard. Full screen and TV mode lay the page over the app. Embedded, only the
 * title and the date filter stay. The theme's CSS variables are scoped to this page, where v1 set them on `<body>`.
 */
export function DashboardPageView(props: DashboardPageViewProps) {
  const { dashboard, headerFilters, display, viewAs, layout, onBack } = props;
  const { mode, onModeChange, viewportRef, contentRef, scale } = display;
  const theme = getDashboardTheme(dashboard?.setting.themeName ?? '');
  const full = !layout.embedded;

  const page = (
    <div className="dashboard-theme dashboard-page" data-dashboard-theme={theme.cssName} data-mode={mode} data-embedded={layout.embedded}>
      <header className="dashboard-page__header flex items-center gap-2">
        {full && mode === DashboardMode.View && <Button type="text" icon={<ArrowLeftOutlined />} aria-label="Back" onClick={onBack} />}
        <Typography.Title level={4} className="m-0! min-w-0 flex-1 truncate" style={{ color: 'var(--text-color)' }} title={dashboard?.name}>
          {dashboard?.name ?? ''}
        </Typography.Title>
        {dashboard && <ResetFiltersButton />}
        {dashboard?.setting.mainDateFilter && <MainDateFilter />}
        {full && viewAs.user && <ViewAsBarView user={viewAs.user} onChange={viewAs.onOpen} onExit={viewAs.onExit} />}
        {full && dashboard && <DashboardModeView mode={mode} onChange={onModeChange} onViewAs={viewAs.canViewAs ? viewAs.onOpen : undefined} />}
      </header>
      {full && dashboard && !layout.mobile && <HeaderFilterBar />}
      <div ref={viewportRef} className="dashboard-page__body">
        <div
          ref={contentRef}
          className="dashboard-page__fit"
          style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}
        >
          <Body {...props} />
        </div>
      </div>
      {viewAs.picking && <ViewAsModal onPick={viewAs.onPick} onCancel={viewAs.onCancel} />}
    </div>
  );
  // A new dashboard starts from its own filter defaults.
  return dashboard ? (
    <DashboardControlsProvider key={dashboard.id} dashboard={dashboard} headerFilters={headerFilters}>
      {page}
    </DashboardControlsProvider>
  ) : (
    page
  );
}
