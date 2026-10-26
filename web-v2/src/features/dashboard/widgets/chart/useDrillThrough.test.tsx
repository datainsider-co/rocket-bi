import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { DiProvider } from '@/app/di/DiContext';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { DashboardService, DashboardSummary } from '@/core/dashboard/DashboardService';
import { createContainer } from '@/core/di/Container';
import { parseFiltersParam } from '@/core/query/filtersParam';
import { FilterCondition, type InternalFilter } from '@/core/query/internalFilter';
import { fakeDashboardService } from '@/features/directory/testing';
import { DashboardControlsProvider } from '../../controls/DashboardControlsContext';
import { useDrillThrough } from './useDrillThrough';

const dashboard = dashboardFromJson(fixture);
const regionField = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'region', field_type: 'string' };
const series = { class_name: 'series_chart_setting', x_axis: { name: 'Region', function: { class_name: 'group', field: regionField } } };
const channel: InternalFilter = {
  id: -1,
  name: 'Channel',
  field: { ...regionField, field_name: 'sales_channel' },
  condition: FilterCondition.In,
  values: ['Online'],
  enabled: true,
  nested: false
};

function setup(listDrillThrough: DashboardService['listDrillThrough']) {
  const service = fakeDashboardService({ listDrillThrough: vi.fn<DashboardService['listDrillThrough']>(listDrillThrough) });
  const container = createContainer([di => di.bindValue(DashboardService, service)]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/dashboard/v2-sample-1?token=abc']}>
      <QueryClientProvider client={queryClient}>
        <DiProvider container={container}>
          <DashboardControlsProvider dashboard={dashboard} headerFilters={[channel]} storage={{ load: () => undefined, save: () => {} }}>
            {children}
          </DashboardControlsProvider>
        </DiProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
  return { service, wrapper };
}

describe('useDrillThrough', () => {
  it('lists dashboards on the carried fields and opens one with the filters', async () => {
    const { service, wrapper } = setup(async () => ({ total: 1, dashboards: [new DashboardSummary({ id: 2, name: 'v2 Filters' })] }));
    const open = vi.fn<(url: string) => void>();
    const { result } = renderHook(() => useDrillThrough(series, 'Asia', 1, open), { wrapper });

    await waitFor(() => expect(result.current.choices?.dashboards).toHaveLength(1));
    expect(service.listDrillThrough).toHaveBeenCalledWith(
      { fields: [channel.field, regionField], excludeIds: [1], from: 0, size: 40 },
      expect.anything()
    );
    expect(result.current.choices?.hasMore).toBe(false);

    act(() => result.current.drillThrough({ id: 2, name: 'v2 Filters' }));
    const url = new URL(open.mock.calls[0]![0], 'http://app.test');
    expect(url.pathname).toBe('/dashboard/v2-filters-2');
    expect(url.searchParams.get('token')).toBe('abc');
    expect(parseFiltersParam(url.searchParams.get('filters')).map(filter => [filter.name, filter.values])).toEqual([
      ['Channel', ['Online']],
      ['Region', ['Asia']]
    ]);
  });

  it('asks nothing while no point is clicked, and hides the item for tab filters', () => {
    const { service, wrapper } = setup(async () => ({ total: 0, dashboards: [] }));
    const closed = renderHook(() => useDrillThrough(series, undefined, 1), { wrapper });
    expect(closed.result.current.choices).toBeUndefined();
    const tab = renderHook(() => useDrillThrough({ class_name: 'tab_filter_chart_setting' }, 'Asia', 1), { wrapper });
    expect(tab.result.current.choices).toBeUndefined();
    expect(service.listDrillThrough).not.toHaveBeenCalled();
  });
});
