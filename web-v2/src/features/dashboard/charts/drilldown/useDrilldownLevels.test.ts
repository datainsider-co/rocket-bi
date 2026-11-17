import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { visualizationResponseFromJson, type DrilldownResponse } from '@/core/query/VisualizationResponse';
import responses from '@/core/query/queryResponses.fixture.json';
import { useDrilldownLevels } from './useDrilldownLevels';

const response = visualizationResponseFromJson(responses.drilldown_chart_setting) as DrilldownResponse;
const offline = { id: 'Offline', name: 'Offline' };
const offlineC = { id: 'Offline.C', name: 'C' };

describe('useDrilldownLevels', () => {
  it('starts on the first level and goes one level down per click', () => {
    const { result } = renderHook(() => useDrilldownLevels(response));
    expect(result.current.steps).toEqual([]);
    act(() => result.current.drill(offline));
    act(() => result.current.drill(offlineC));
    expect(result.current.steps).toEqual([offline, offlineC]);
  });

  it('goes back to the chart as it was before a step', () => {
    const { result } = renderHook(() => useDrilldownLevels(response));
    act(() => result.current.drill(offline));
    act(() => result.current.drill(offlineC));
    act(() => result.current.back(1));
    expect(result.current.steps).toEqual([offline]);
    act(() => result.current.back(0));
    expect(result.current.steps).toEqual([]);
  });

  it('keeps the level through a render with the same response', () => {
    const { result, rerender } = renderHook(({ data }) => useDrilldownLevels(data), { initialProps: { data: response } });
    act(() => result.current.drill(offline));
    rerender({ data: response });
    expect(result.current.steps).toEqual([offline]);
  });

  it('shows the deepest level a new response still has', () => {
    const { result, rerender } = renderHook(({ data }) => useDrilldownLevels(data), { initialProps: { data: response } });
    act(() => result.current.drill(offline));
    act(() => result.current.drill(offlineC));
    const withoutC: DrilldownResponse = { ...response, drilldown: response.drilldown.filter(level => level.id !== 'Offline.C') };
    rerender({ data: withoutC });
    expect(result.current.steps).toEqual([offline]);
    rerender({ data: { kind: 'drilldown', name: 'region', series: [], drilldown: [] } });
    expect(result.current.steps).toEqual([]);
  });

  it('drills from the level shown, not from one the response lost', () => {
    const { result, rerender } = renderHook(({ data }) => useDrilldownLevels(data), { initialProps: { data: response } });
    act(() => result.current.drill({ id: 'Online', name: 'Online' }));
    const offlineOnly: DrilldownResponse = { ...response, drilldown: response.drilldown.filter(level => level.id !== 'Online') };
    rerender({ data: offlineOnly });
    act(() => result.current.drill(offline));
    expect(result.current.steps).toEqual([offline]);
  });
});
