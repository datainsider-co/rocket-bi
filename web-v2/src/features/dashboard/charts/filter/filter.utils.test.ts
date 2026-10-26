import { describe, expect, it } from 'vitest';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type TableResponse } from '@/core/query/VisualizationResponse';
import {
  dateSelectionOf,
  dateSelectionToControl,
  filterOptions,
  functionOptions,
  isNumberInput,
  searchOptions,
  selectionOf,
  selectionToControl,
  toggleOption,
  toggleRequiredOption
} from './filter.utils';

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

describe('tab control', () => {
  it('offers its columns by name', () => {
    const setting = { values: [{ name: 'Revenue' }, { name: 'Total profit' }, { name: 'Cost' }] };
    expect(functionOptions(setting)).toEqual([
      { label: 'Cost', value: 'cost_2' },
      { label: 'Revenue', value: 'revenue_0' },
      { label: 'Total profit', value: 'totalProfit_1' }
    ]);
  });

  it('keeps at least one column picked', () => {
    expect(toggleRequiredOption(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleRequiredOption(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleRequiredOption(['a'], 'a')).toEqual(['a']);
  });
});

describe('date selection', () => {
  const now = new Date(2026, 7, 19);

  it('reads the mode and range, inferring Custom or All Time', () => {
    expect(dateSelectionOf({ mode: 'last_year', min_value: ['a'], max_value: ['b'] })).toEqual({ mode: 'last_year', range: ['a', 'b'] });
    expect(dateSelectionOf({ min_value: ['a'], max_value: ['b'] })).toEqual({ mode: 'custom', range: ['a', 'b'] });
    expect(dateSelectionOf(undefined)).toEqual({ mode: 'all_time', range: [] });
  });

  it('computes the range of a pick, all time holding none', () => {
    expect(dateSelectionToControl('last_year', [], now)).toEqual({
      mode: 'last_year',
      min_value: ['2025-01-01 00:00:00'],
      max_value: ['2025-12-31 23:59:59']
    });
    expect(dateSelectionToControl('custom', ['a', 'b'], now)).toEqual({ mode: 'custom', min_value: ['a'], max_value: ['b'] });
    expect(dateSelectionToControl('all_time', [], now)).toEqual({ mode: 'all_time' });
    expect(dateSelectionToControl('custom', [], now)).toEqual({ mode: 'all_time' });
  });
});

describe('isNumberInput', () => {
  const column = (fieldType: string) => ({ values: [{ function: { field: { field_type: fieldType } } }] });

  it('follows the column type', () => {
    expect(isNumberInput(column('Int32'), false)).toBe(true);
    expect(isNumberInput(column('string'), true)).toBe(false);
  });

  it('follows the options without column', () => {
    expect(isNumberInput({ values: [] }, true)).toBe(true);
    expect(isNumberInput({}, undefined)).toBe(false);
  });
});
