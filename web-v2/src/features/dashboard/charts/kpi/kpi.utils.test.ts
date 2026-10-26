import { describe, expect, it } from 'vitest';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type SeriesOneResponse } from '@/core/query/VisualizationResponse';
import { vizFromSetting } from '@/core/query/vizOptions';
import { buildKpi } from './kpi.utils';

const options = vizFromSetting(fixture.widgets.find(widget => widget.id === 3)!.setting as Record<string, unknown>).options;
const response = visualizationResponseFromJson(responses.number_chart_setting) as SeriesOneResponse;

describe('buildKpi', () => {
  it('formats the single value with the stored prefix, precision and display unit', () => {
    const kpi = buildKpi(options, response);
    // Stored with `display_unit: 'none'`.
    expect(kpi.value).toBe('250,771,358.37');
    expect(kpi.exactValue).toBe('250,771,358.37');
    expect(kpi.prefix).toBe('$');
    expect(kpi.postfix).toBe('');
    expect(kpi.title).toMatchObject({ text: 'Total revenue', style: { textAlign: 'center', fontSize: '20px' } });
    expect(kpi.valueStyle).toMatchObject({ fontSize: '42px', fontWeight: '600', justifyContent: 'flex-start' });
  });

  it('scales with the default display unit', () => {
    expect(buildKpi({}, response).value).toBe('250.77M');
  });

  it('shows -- without a value', () => {
    const empty: SeriesOneResponse = { kind: 'series_one', series: [], xAxis: [], yAxis: [] };
    expect(buildKpi({}, empty)).toMatchObject({ value: '--', prefix: '', icon: undefined, title: undefined });
  });

  it('builds the icon when enabled', () => {
    const kpi = buildKpi({ icon: { enabled: true, iconClass: 'setting-icon-wallet', color: '#fff', background: '#000' } }, response);
    expect(kpi.icon).toEqual({ className: 'setting-icon-wallet', style: { color: '#fff', background: '#000', borderRadius: '4px', boxShadow: undefined } });
  });
});
