import { describe, expect, it } from 'vitest';
import type { SchemaColumn } from '@/core/schema/SchemaService';
import { columnNameOf, escapeIdentifier, FormulaError, toExpression, toFormula } from './formula.utils';

const columns: SchemaColumn[] = [
  { name: 'total_profit', displayName: 'Total Profit', type: 'double' },
  { name: 'region', displayName: 'Region Name ', type: 'string' },
  { name: 'name', displayName: 'Customer', type: 'string' },
  { name: 'year', displayName: 'Order Year', type: 'int32' }
];

describe('toExpression', () => {
  it('replaces each [Display Name] with the column name', () => {
    expect(toExpression('[Total Profit] * 2 + length([Region Name])', columns)).toBe('total_profit * 2 + length(region)');
  });

  it('trims the name inside the brackets', () => {
    expect(toExpression('[ Total Profit ]', columns)).toBe('total_profit');
  });

  it('leaves brackets inside quoted strings', () => {
    expect(toExpression(`concat('[Customer]', "[x]", [Customer])`, columns)).toBe(`concat('[Customer]', "[x]", name)`);
  });

  it('fails on an unknown column', () => {
    expect(() => toExpression('[Nope] + 1', columns)).toThrow(FormulaError);
    expect(() => toExpression('[Nope] + 1', columns)).toThrow('Column [Nope] does not exist in this table');
  });

  it('keeps a formula without brackets', () => {
    expect(toExpression('', columns)).toBe('');
    expect(toExpression('1 + 1', [])).toBe('1 + 1');
  });
});

describe('toFormula', () => {
  it('replaces column names with their display names in brackets', () => {
    expect(toFormula('total_profit * 2 + length(region)', columns)).toBe('[Total Profit] * 2 + length([Region Name])');
  });

  it('replaces a display name only once, even when it holds another column name', () => {
    // v1 turned `region` into `[Region Name]`, then `name` inside it into `[Customer]`.
    expect(toFormula('region', columns)).toBe('[Region Name]');
  });

  it('ignores case like SQL, preferring the exact name', () => {
    expect(toFormula('TOTAL_PROFIT', columns)).toBe('[Total Profit]');
  });

  it('leaves function calls, quoted strings and unknown names', () => {
    expect(toFormula(`year(order_date) + year`, columns)).toBe(`year(order_date) + [Order Year]`);
    expect(toFormula(`concat('region', name)`, columns)).toBe(`concat('region', [Customer])`);
    expect(toFormula('other + 1', columns)).toBe('other + 1');
  });

  it('reads backticked names', () => {
    expect(toFormula('`total_profit` / 2', columns)).toBe('[Total Profit] / 2');
    expect(toFormula('`unknown`', columns)).toBe('`unknown`');
  });

  it('goes back to the formula it came from', () => {
    const formula = 'if([Total Profit] > 0, [Region Name], [Customer])';
    expect(toFormula(toExpression(formula, columns), columns)).toBe(formula);
  });
});

describe('columnNameOf', () => {
  it.each([
    ['Total Profit', 'total_profit'],
    ['avgRevenue', 'avg_revenue'],
    ['Doanh thu tháng', 'doanh_thu_thang'],
    ['  ', ''],
    ['利润', ''],
    ['Lợi nhuận 利润 2024', 'loi_nhuan_2024']
  ])('turns %j into %j', (displayName, expected) => {
    expect(columnNameOf(displayName)).toBe(expected);
  });
});

describe('escapeIdentifier', () => {
  it('quotes names that are not plain words', () => {
    expect(escapeIdentifier('total_profit')).toBe('total_profit');
    expect(escapeIdentifier('Total Profit')).toBe('`Total Profit`');
  });
});
