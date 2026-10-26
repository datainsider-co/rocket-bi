import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { clearSession, saveSession } from '@/core/session/session';
import { fakeAuthenticationService, renderAppAt } from '@/features/auth/testing';
import { fakeDashboardService } from '@/features/directory/testing';
import { ApiError } from '@/shared/http/ApiError';

/** The page loads lazily and draws charts; under a full parallel run that can take more than the default second. */
const SLOW = { timeout: 5000 };

function renderAt(path: string, get: DashboardService['get']) {
  return renderAppAt(path, fakeAuthenticationService(), [
    di => di.bindValue(DashboardService, fakeDashboardService({ get: vi.fn<DashboardService['get']>(get) }))
  ]);
}

describe('dashboard page', () => {
  beforeEach(() => saveSession('session-1', 60));
  afterEach(() => {
    clearSession();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the dashboard and its widgets', async () => {
    const get = vi.fn<DashboardService['get']>(async () => dashboardFromJson(fixture));
    renderAt('/dashboard/v2-sample-1', get);

    expect(await screen.findByRole('heading', { name: 'v2 Sample' }, SLOW)).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(1);
    // Text widget, rendered as HTML.
    expect(screen.getByText('Sample').tagName).toBe('B');
    // The tab widget's first tab.
    expect(screen.getByRole('tab', { name: 'Pie' })).toBeInTheDocument();
  });

  it('queries and draws each chart', async () => {
    // Filling charts wait for their container's size; jsdom lays nothing out, so report one.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe() {
          this.callback([{ contentRect: { width: 400, height: 300 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
        }
        unobserve() {}
        disconnect() {}
      }
    );
    renderAt('/dashboard/v2-sample-1', async () => dashboardFromJson(fixture));

    // KPI with its prefix, and the Highcharts charts (column, pie, the pie in the tab) with response categories.
    expect(await screen.findByText('250,771,358.37', {}, SLOW)).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('highcharts-chart')).toHaveLength(3), SLOW);
    expect(screen.getAllByText('North America')).not.toHaveLength(0);
    // Filters come with M3.
    expect(screen.getByText('tab_filter_chart_setting is not supported yet')).toBeInTheDocument();
  });

  it('rewrites an outdated name in the URL', async () => {
    const router = renderAt('/dashboard/old-name-1?token=abc', async () => dashboardFromJson(fixture));

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/v2-sample-1'), SLOW);
    expect(router.state.location.search).toBe('?token=abc');
  });

  it('goes to All Data when the dashboard does not exist', async () => {
    const router = renderAt('/dashboard/gone-7', async () => {
      throw new ApiError('no dashboard found for id: 7', 404, 'not_found');
    });

    await waitFor(() => expect(router.state.location.pathname).toBe('/mydata'), SLOW);
  });

  it('explains a missing permission', async () => {
    renderAt('/dashboard/secret-2', async () => {
      throw new ApiError('You do not have permissions to perform this action!', 401, 'not_allowed');
    });

    expect(await screen.findByText("You don't have permission to view dashboard", {}, SLOW)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
