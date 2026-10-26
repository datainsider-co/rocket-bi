import { describe, expect, it } from 'vitest';
import { widgetFromJson, type ChartWidget } from '@/core/dashboard/Widget';
import { chartSubtitle, chartTitle } from './chartWidget.utils';

const chart = (options: Record<string, unknown>, name = 'Widget name') =>
  widgetFromJson({ class_name: 'chart_v3', id: 1, name, setting: { options: { options } } }) as ChartWidget;

describe('chart titles', () => {
  it('reads title and subtitle objects', () => {
    const widget = chart({ title: { text: 'Revenue' }, subtitle: { text: 'by region' } });
    expect(chartTitle(widget)).toBe('Revenue');
    expect(chartSubtitle(widget)).toBe('by region');
  });

  it('reads plain string titles of old charts', () => {
    expect(chartTitle(chart({ title: 'Old' }))).toBe('Old');
  });

  it('falls back to the widget name', () => {
    expect(chartTitle(chart({}))).toBe('Widget name');
    expect(chartSubtitle(chart({}))).toBe('');
  });
});
