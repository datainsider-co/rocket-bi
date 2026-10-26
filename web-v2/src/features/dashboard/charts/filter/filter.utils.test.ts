import { describe, expect, it } from 'vitest';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type TableResponse } from '@/core/query/VisualizationResponse';
import { filterOptions, searchOptions, selectionOf, selectionToControl, toggleOption } from './filter.utils';

const response = visualizationResponseFromJson(responses.tab_filter_chart_setting) as TableResponse;

describe('filterOptions', () => {
  it('reads label and value columns', () => {
    expect(filterOptions(response, false)[0]).toEqual({ label: 'Asia', value: 'Asia' });
  });

  it('uses the only column as both without a label column', () => {
    const single: TableResponse = { kind: 'table', headers: ['value'], records: [['b'], ['a']], total: 2 };
    expect(filterOptions(single, true)).toEqual([
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' }
    ]);
  });
});

describe('selection', () => {
  it('maps none selected to All, which clears the control', () => {
    expect(selectionOf(undefined)).toEqual([]);
    expect(selectionToControl([])).toEqual({});
    expect(selectionToControl(['Asia'])).toEqual({ selected_value: ['Asia'] });
    expect(selectionOf({ selected_value: ['Asia'] })).toEqual(['Asia']);
  });

  it('toggles multi choice options, every option being All', () => {
    expect(toggleOption([], 'a', 3)).toEqual(['a']);
    expect(toggleOption(['a'], 'a', 3)).toEqual([]);
    expect(toggleOption(['a', 'b'], 'c', 3)).toEqual([]);
  });

  it('searches labels ignoring case', () => {
    expect(searchOptions(filterOptions(response, false), 'AS').map(option => option.value)).toEqual(['Asia']);
  });
});
