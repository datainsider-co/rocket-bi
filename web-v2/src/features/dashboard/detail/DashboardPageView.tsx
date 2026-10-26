import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { InternalFilter } from '@/core/query/internalFilter';
import type { DashboardAccess } from '../access/useDashboardAccess';
import { DashboardControlsProvider } from '../controls/DashboardControlsContext';
import { HeaderFilterBar } from '../controls/header-filters/HeaderFilterBar';
import { MainDateFilter } from '../controls/MainDateFilter';
import { ResetFiltersButton } from '../controls/ResetFiltersButton';
import { EditDialogsView } from '../edit/EditDialogsView';
import { addMenuItems } from '../edit/editMenus.utils';
import { EditToolbarView } from '../edit/EditToolbarView';
import type { DashboardEditing } from '../edit/useDashboardEditing';
import { DashboardMode } from '../mode/dashboardMode.utils';
import { DashboardModeView } from '../mode/DashboardModeView';
import type { DashboardDisplay } from '../mode/useDashboardDisplay';
import { getDashboardTheme } from '../theme/dashboardThemes';
import type { ViewAs } from '../view-as/useViewAs';
import { ViewAsBarView } from '../view-as/ViewAsBarView';
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
  onBack: () => void;
}

/**
 * `/dashboard/:name` (v1 `DashboardDetail.vue`): header with back, title, edit and options, the header filters (not
 * on mobile, like v1), then the dashboard. Full screen and TV mode lay the page over the app. Embedded, only the title
 * and the date filter stay. The theme's CSS variables are scoped to this page, where v1 set them on `<body>`.
 */
export function DashboardPageView(props: DashboardPageViewProps) {
  const { dashboard, headerFilters, state, layout, onBack } = props;
  const { display, viewAs, editing } = state;
  const { mode, onModeChange, viewportRef, contentRef, scale } = display;
  const theme = getDashboardTheme(dashboard?.setting.themeName ?? '');
  const full = !layout.embedded;
  const isEditing = editing.mode.editing;
  const viewing = full && !isEditing;

  const page = (
    <div className="dashboard-theme dashboard-page" data-dashboard-theme={theme.cssName} data-mode={mode} data-embedded={layout.embedded} data-editing={isEditing}>
      <header className="dashboard-page__header flex items-center gap-2">
        {full && mode === DashboardMode.View && <Button type="text" icon={<ArrowLeftOutlined />} aria-label="Back" onClick={onBack} />}
        <Typography.Title level={4} className="m-0! min-w-0 truncate" style={{ color: 'var(--text-color)' }} title={dashboard?.name}>
          {dashboard?.name ?? ''}
        </Typography.Title>
        {isEditing && (
          <Button type="text" size="small" icon={<EditOutlined />} aria-label="Rename dashboard" onClick={() => editing.dialogs.open({ kind: 'renameDashboard' })} />
        )}
        <span className="flex-1" />
        {dashboard && <ResetFiltersButton />}
        {dashboard?.setting.mainDateFilter && <MainDateFilter />}
        {viewing && viewAs.user && <ViewAsBarView user={viewAs.user} onChange={viewAs.onOpen} onExit={viewAs.onExit} />}
        {full && dashboard && mode === DashboardMode.View && (
          <EditToolbarView
            editing={isEditing}
            canEdit={editing.canEdit && !viewAs.user}
            saving={editing.mode.saving}
            addItems={addMenuItems(editing.actions.add)}
            onEdit={editing.mode.start}
            onSettings={() => editing.dialogs.open({ kind: 'settings' })}
            onSave={() => void editing.mode.save()}
          />
        )}
        {viewing && dashboard && <DashboardModeView mode={mode} onChange={onModeChange} onViewAs={viewAs.canViewAs ? viewAs.onOpen : undefined} />}
      </header>
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
