import type { ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { InternalFilter } from '@/core/query/internalFilter';
import type { DashboardAccess } from '../access/useDashboardAccess';
import { DashboardControlsProvider } from '../controls/DashboardControlsContext';
import { HeaderFilterBar } from '../controls/header-filters/HeaderFilterBar';
import { EditDialogsView } from '../edit/EditDialogsView';
import type { DashboardEditing } from '../edit/useDashboardEditing';
import { DashboardControlBar } from '../header/DashboardControlBar';
import { DashboardHeaderView } from '../header/DashboardHeaderView';
import type { DashboardOptionHandlers } from '../header/headerOptions.utils';
import { DashboardMode } from '../mode/dashboardMode.utils';
import type { DashboardDisplay } from '../mode/useDashboardDisplay';
import { getDashboardTheme } from '../theme/dashboardThemes';
import type { ViewAs } from '../view-as/useViewAs';
import { ViewAsModal } from '../view-as/ViewAsModal';
import '../theme/dashboardTheme.css';
import { DashboardPageBody } from './DashboardPageBody';
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

/** What the page lets the viewer do besides looking. */
export interface DashboardPageState {
  access: DashboardAccess;
  display: DashboardDisplay;
  viewAs: ViewAs;
  editing: DashboardEditing;
}

export interface DashboardPageViewProps {
  /** The dashboard as shown: in edit mode, with the unsaved layout. */
  dashboard?: Dashboard;
  /** The filters the URL opened the dashboard with (`?filters=`). */
  headerFilters?: readonly InternalFilter[];
  load: DashboardLoad;
  state: DashboardPageState;
  layout: DashboardLayout;
  /** Relationship and Share in the Options menu, from their own features. */
  options?: DashboardOptionHandlers;
  /** ChartBuilder while it is open, inside the dashboard's controls so its preview applies them. */
  builder?: ReactNode;
  onBack: () => void;
}

const NO_OPTIONS: DashboardOptionHandlers = {};

/**
 * `/dashboard/:name` (v1 `DashboardDetail.vue`): header with back, title, edit and options, the header filters (not
 * on mobile, like v1), then the dashboard. Full screen and TV mode lay the page over the app. Embedded, only the title
 * and the date filter stay. The theme's CSS variables are scoped to this page, where v1 set them on `<body>`.
 */
export function DashboardPageView(props: DashboardPageViewProps) {
  const { dashboard, headerFilters, state, layout, options = NO_OPTIONS, builder, onBack } = props;
  const { display, viewAs, editing } = state;
  const { mode, viewportRef, contentRef, scale } = display;
  const theme = getDashboardTheme(dashboard?.setting.themeName ?? '');
  const full = !layout.embedded;
  const isEditing = editing.mode.editing;

  const page = (
    <div className="dashboard-theme dashboard-page" data-dashboard-theme={theme.cssName} data-mode={mode} data-embedded={layout.embedded} data-editing={isEditing}>
      <DashboardHeaderView
        title={dashboard?.name ?? ''}
        onBack={full && mode === DashboardMode.View ? onBack : undefined}
        onRename={full && isEditing ? () => editing.dialogs.open({ kind: 'renameDashboard' }) : undefined}
      >
        {dashboard && <DashboardControlBar dashboard={dashboard} state={state} layout={layout} options={options} />}
      </DashboardHeaderView>
      {full && dashboard && !layout.mobile && <HeaderFilterBar />}
      <div ref={viewportRef} className="dashboard-page__body">
        <div
          ref={contentRef}
          className="dashboard-page__fit"
          style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}
        >
          <DashboardPageBody {...props} />
        </div>
      </div>
      {viewAs.picking && <ViewAsModal onPick={viewAs.onPick} onCancel={viewAs.onCancel} />}
      <EditDialogsView dialogs={editing.dialogs} dashboard={dashboard} />
      {builder}
    </div>
  );
  // A new dashboard starts from its own filter defaults; so does one whose date filter was set up or removed.
  return dashboard ? (
    <DashboardControlsProvider key={`${dashboard.id}:${dashboard.setting.mainDateFilter?.mode ?? ''}`} dashboard={dashboard} headerFilters={headerFilters}>
      {page}
    </DashboardControlsProvider>
  ) : (
    page
  );
}
