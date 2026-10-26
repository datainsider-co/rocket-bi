import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { FILTERS_PARAM, parseFiltersParam } from '@/core/query/filtersParam';
import { dashboardPath, parseIdParam } from '@/shared/routing/idParam';
import { dashboardQueryOptions } from './dashboardQueries';
import { dashboardErrorMessage, isNotFoundError } from './dashboardDetail.utils';

const HOME = '/mydata';

/**
 * Loads the dashboard of `/dashboard/<slug>-<id>`. Like v1, an unknown dashboard goes back to All Data and a URL whose
 * name is out of date (renamed elsewhere) is rewritten, keeping the query string (`?token=`, filters).
 */
export function useDashboardPage() {
  const { name: param } = useParams();
  const id = parseIdParam(param);
  const service = useDi(DashboardService);
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery({ ...dashboardQueryOptions(service, id ?? 0), enabled: id !== undefined });
  const dashboard = query.data;
  // Read once per URL; the controls only take them as their starting point.
  const headerFilters = useMemo(() => parseFiltersParam(new URLSearchParams(location.search).get(FILTERS_PARAM)), [location.search]);

  const isMissing = id === undefined || isNotFoundError(query.error);
  useEffect(() => {
    if (isMissing) void navigate(HOME, { replace: true });
  }, [isMissing, navigate]);

  useEffect(() => {
    if (!dashboard) return;
    const path = dashboardPath(dashboard.id, dashboard.name);
    if (path !== location.pathname) void navigate({ pathname: path, search: location.search }, { replace: true });
  }, [dashboard, location.pathname, location.search, navigate]);

  // React Router counts entries it pushed; at 0 this page was opened directly.
  const canGoBack = typeof window.history.state?.idx === 'number' && window.history.state.idx > 0;

  return {
    dashboard,
    headerFilters,
    isLoading: query.isPending && !isMissing,
    error: query.error && !isMissing ? dashboardErrorMessage(query.error) : undefined,
    retry: () => void query.refetch(),
    goBack: () => void (canGoBack ? navigate(-1) : navigate(HOME))
  };
}
