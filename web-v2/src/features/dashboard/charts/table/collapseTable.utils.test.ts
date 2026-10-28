import { describe, expect, it } from 'vitest';
import type { JsonObject } from '@/core/json/json';
import responses from '@/core/query/queryResponses.fixture.json';
import { visualizationResponseFromJson, type JsonTableResponse } from '@/core/query/VisualizationResponse';
import {
  collapseRowClassName,
  columnNameOfLabel,
  columnOfLabel,
  isCollapseTableSetting,
  shownRowIndexes,
  sortByColumnName,
  sortByLabel,
  toggledRows,
  toTreeRows
} from './collapseTable.utils';

/** A real response (region > country, two countries kept per region), from the setting v1's builder made. */
const response = visualizationResponseFromJson(responses.group_table_chart_setting) as JsonTableResponse;

const column = (name: string): JsonObject => ({ name, function: { class_name: 'group' } });
const columns = [column('region'), column('country'), column('total_revenue'), column('units_sold')];

describe('isCollapseTableSetting', () => {
  it('tells the group table setting from the others', () => {
    expect(isCollapseTableSetting({ class_name: 'group_table_chart_setting' })).toBe(true);
    expect(isCollapseTableSetting({ class_name: 'table_chart_setting' })).toBe(false);
  });
});

describe('toTreeRows', () => {
  it('nests the groups under their row, keyed by position from the page start', () => {
    const [asia] = toTreeRows(response.records, 20);
    expect(asia?.key).toBe('20');
    expect(asia?.record['960db2']).toBe('Asia');
    expect(asia?.children?.map(row => [row.key, row.record['960db2']])).toEqual([
      ['20-0', 'Bangladesh'],
      ['20-1', 'Bhutan']
    ]);
  });

  it('leaves the last level and records without groups without children', () => {
    const [asia] = toTreeRows(response.records, 0);
    expect(asia?.children?.[0]).not.toHaveProperty('children');
    expect(toTreeRows([{ a: 1 }], 0)).toEqual([{ key: '0', record: { a: 1 } }]);
    expect(toTreeRows([], 0)).toEqual([]);
  });
});

describe('shownRowIndexes', () => {
  const rows = toTreeRows(response.records, 0);

  it('counts the top rows only while nothing is expanded', () => {
    expect([...shownRowIndexes(rows, [])]).toEqual([
      ['0', 0],
      ['1', 1],
      ['2', 2]
    ]);
  });

  it("puts an expanded row's children right after it", () => {
    expect([...shownRowIndexes(rows, ['1'])]).toEqual([
      ['0', 0],
      ['1', 1],
      ['1-0', 2],
      ['1-1', 3],
      ['2', 4]
    ]);
  });

  it('ignores the expanded children of a collapsed row', () => {
    expect(shownRowIndexes(rows, ['0-0']).has('0-0')).toBe(false);
    expect(shownRowIndexes(rows, ['5']).size).toBe(3);
  });
});

describe('collapseRowClassName', () => {
  const shown = new Map([
    ['0', 0],
    ['0-0', 1]
  ]);

  it('stripes by the shown position and marks expanded rows', () => {
    expect(collapseRowClassName('0', shown, ['0'])).toBe('flatten-table__row--even flatten-table__row--expanded');
    expect(collapseRowClassName('0-0', shown, ['0'])).toBe('flatten-table__row--odd');
    expect(collapseRowClassName('9', shown, [])).toBe('flatten-table__row--even');
  });
});

describe('toggledRows', () => {
  it('adds a row with its path or removes it, without changing its input', () => {
    const open = new Map([['1', ['Asia']]]);
    expect([...toggledRows(open, { key: '2', path: ['Europe'] })]).toEqual([
      ['1', ['Asia']],
      ['2', ['Europe']]
    ]);
    expect(toggledRows(open, { key: '1' }).size).toBe(0);
    expect([...open]).toEqual([['1', ['Asia']]]);
  });

  it('keeps an empty path for a row without one', () => {
    expect(toggledRows(new Map(), { key: '0' }).get('0')).toEqual([]);
  });
});

describe('columnOfLabel', () => {
  it('finds the column by its name, or the name before " by "', () => {
    expect(columnOfLabel(columns, 'region')).toBe(columns[0]);
    expect(columnOfLabel(columns, 'total_revenue by region')).toBe(columns[2]);
  });

  it('prefers the longest name', () => {
    const total = column('total');
    const totalBy = column('total by year');
    expect(columnOfLabel([total, totalBy], 'total by year by region')).toBe(totalBy);
    expect(columnOfLabel([totalBy, total], 'total by region')).toBe(total);
  });

  it('finds nothing for an unknown label or columns without a name', () => {
    expect(columnOfLabel(columns, 'profit by region')).toBeUndefined();
    expect(columnOfLabel([{}, 'x'], 'region')).toBeUndefined();
  });
});

describe('columnNameOfLabel', () => {
  it("gives the column's name, or the label when no column matches", () => {
    expect(columnNameOfLabel(columns, 'units_sold by region')).toBe('units_sold');
    expect(columnNameOfLabel(columns, 'profit')).toBe('profit');
  });
});

describe('sortByColumnName / sortByLabel', () => {
  const labels = response.headers.map(header => header.label);

  it("sorts by the column's name and shows it on the header's label", () => {
    const sort = sortByColumnName({ column: 'total_revenue by region', direction: 'DESC' }, columns);
    expect(sort).toEqual({ column: 'total_revenue', direction: 'DESC' });
    expect(sortByLabel(sort, columns, labels)).toEqual({ column: 'total_revenue by region', direction: 'DESC' });
  });

  it('keeps no sort, and a sort no header shows', () => {
    expect(sortByColumnName(undefined, columns)).toBeUndefined();
    expect(sortByLabel(undefined, columns, labels)).toBeUndefined();
    expect(sortByLabel({ column: 'country', direction: 'ASC' }, columns, labels)).toEqual({ column: 'country', direction: 'ASC' });
  });
});
