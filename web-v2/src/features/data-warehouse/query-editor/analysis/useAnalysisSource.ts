import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { DirectoryService } from '@/core/directory/DirectoryService';
import type { DashboardPermissions } from '@/features/dashboard/access/access.utils';
import { dashboardDirectoryQueryOptions } from '@/features/dashboard/access/dashboardDirectoryQuery';
import { useDashboardAccess } from '@/features/dashboard/access/useDashboardAccess';
import { dashboardQueryOptions } from '@/features/dashboard/detail/dashboardQueries';
import { isNotFoundError } from '@/features/dashboard/detail/dashboardDetail.utils';
import { toBreadcrumbs, type Breadcrumb } from '@/features/directory/directory.utils';
import { parentsQueryOptions } from '@/features/directory/directoryQueries';
import { analysisErrorMessage } from './analysis.utils';

export interface LoadedAnalysis {
  readonly dashboard: Dashboard;
  readonly permissions: DashboardPermissions;
}

export type AnalysisSourceState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: string; readonly retry: (() => void) | undefined }
  | { readonly status: 'locked'; readonly onUnlock: (password: string) => string | undefined }
  | { readonly status: 'ready'; readonly analysis: LoadedAnalysis };

/** The folders down to the analysis, links to My Data, for the page's header (v1 `initBreadcrumbs`). */
function useAnalysisCrumbs(dashboard: Dashboard | undefined): Breadcrumb[] {
  const dashboards = useDi(DashboardService);
  const directories = useDi(DirectoryService);
  const directory = useQuery({ ...dashboardDirectoryQueryOptions(dashboards, directories, dashboard?.id ?? 0), enabled: dashboard !== undefined });
  const id = directory.data?.id ?? -1;
  const parents = useQuery(parentsQueryOptions(directories, id));
  // The path ends with the analysis itself, shown as the title.
  return useMemo(() => toBreadcrumbs(parents.data).filter(crumb => crumb.key !== String(id)), [parents.data, id]);
}

/**
 * A saved analysis (v1 `QueryEditor.initAnalysis`): the dashboard, then its password like M5a, and what the viewer may
 * do on it. Asked again on each visit, like a dashboard.
 */
export function useAnalysisSource(id: number | undefined): { state: AnalysisSourceState; crumbs: Breadcrumb[]; name: string | undefined } {
  const service = useDi(DashboardService);
  const query = useQuery({ ...dashboardQueryOptions(service, id ?? 0), enabled: id !== undefined });
  const dashboard = query.data;
  const access = useDashboardAccess(dashboard);
  const crumbs = useAnalysisCrumbs(dashboard);
  const { permissions } = access;
  const analysis = useMemo(() => dashboard && { dashboard, permissions }, [dashboard, permissions]);

  const state = ((): AnalysisSourceState => {
    if (id === undefined) return { status: 'loading' };
    if (query.isError) return { status: 'error', error: analysisErrorMessage(query.error), retry: isNotFoundError(query.error) ? undefined : () => void query.refetch() };
    if (!analysis || access.lock === 'checking') return { status: 'loading' };
    if (access.lock === 'locked') return { status: 'locked', onUnlock: access.onUnlock };
    return { status: 'ready', analysis };
  })();

  return { state, crumbs, name: dashboard?.name };
}
