import { describe, expect, it } from 'vitest';
import { widgetFromJson } from '@/core/dashboard/Widget';
import { matchingOptions, pickOptionOf, toggled } from './pickWidgets.utils';

describe('pickOptionOf', () => {
  it("gives a chart its type's icon", () => {
    const chart = widgetFromJson({ class_name: 'chart_v3', id: 4, name: 'Profit', extra_data: { current_chart_type: 'pie' } });
    expect(pickOptionOf(chart)).toEqual({ id: 4, label: 'Profit', icon: expect.stringMatching(/^\/chart-builder\/charts\/.+\.svg$/) });
  });

  it('gives a text no icon', () => {
    const text = widgetFromJson({ class_name: 'text_widget', id: 5, content: 'Hello' });
    expect(pickOptionOf(text)).toEqual({ id: 5, label: 'Hello', icon: undefined });
  });
});

describe('matchingOptions', () => {
  const options = [
    { id: 1, label: 'Profit by year' },
    { id: 2, label: 'Sales' }
  ];

  it('keeps every option for an empty keyword', () => {
    expect(matchingOptions(options, '  ')).toEqual(options);
  });

  it('matches part of the name in any case', () => {
    expect(matchingOptions(options, 'PROFIT')).toEqual([options[0]]);
    expect(matchingOptions(options, 'x')).toEqual([]);
  });
});

describe('toggled', () => {
  it('adds an id and removes it again', () => {
    expect(toggled([1], 2)).toEqual([1, 2]);
    expect(toggled([1, 2], 1)).toEqual([2]);
  });
});
