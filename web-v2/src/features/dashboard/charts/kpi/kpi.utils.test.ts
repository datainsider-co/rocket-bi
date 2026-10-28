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

  it("uses v1's plain layout, value centered, without a theme", () => {
    expect(buildKpi({}, response)).toMatchObject({ layout: 'plain', valueStyle: { justifyContent: 'center' } });
    expect(buildKpi({ theme: '' }, response).layout).toBe('plain');
  });

  it("uses v1's themed layout, value on the left, with a theme", () => {
    expect(buildKpi({ theme: 'style_1' }, response)).toMatchObject({ layout: 'themed', valueStyle: { justifyContent: 'flex-start' } });
  });

  it('keeps a stored value alignment in either layout', () => {
    expect(buildKpi({ align: 'right' }, response).valueStyle.justifyContent).toBe('flex-end');
    expect(buildKpi({ theme: 'style_1', align: 'center' }, response).valueStyle.justifyContent).toBe('center');
  });

  it('builds the icon when enabled', () => {
    const kpi = buildKpi({ icon: { enabled: true, iconClass: 'setting-icon-wallet', color: '#fff', background: '#000' } }, response);
    expect(kpi.icon).toEqual({ className: 'setting-icon-wallet', style: { color: '#fff', background: '#000', borderRadius: '4px', boxShadow: undefined } });
  });

  it('picks the trend and area layouts by theme', () => {
    const trendOn = { dataRange: { enabled: true }, trendLine: { enabled: true } };
    expect(buildKpi({ theme: 'style_2', ...trendOn }, response).layout).toBe('trend');
    expect(buildKpi({ theme: 'style_area_1' }, response).layout).toBe('area');
    expect(buildKpi({ ...trendOn }, response).layout).toBe('plain');
  });

  it('adds the comparison and the trend line once their data is in', () => {
    const compared: SeriesOneResponse = { ...response, compareValue: 125385679.185 };
    const kpi = buildKpi({ theme: 'style_1', dataRange: { enabled: true }, comparison: { enabled: true }, trendLine: { enabled: true, color: '#abc' } }, compared, [1, 2]);
    expect(kpi.comparison).toMatchObject({ percentage: 100, text: '+100%' });
    expect(kpi.trend).toEqual({ data: [1, 2], displayAs: 'line', color: '#abc' });
    expect(buildKpi({}, compared)).not.toHaveProperty('comparison');
  });
});
