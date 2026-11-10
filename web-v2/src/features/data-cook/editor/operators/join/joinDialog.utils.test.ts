import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import { etlJobFromJson } from '@/core/data-cook/EtlJob';
import { etlGraphFromLeaves } from '@/core/data-cook/etlGraph';
import { EMPTY_CONDITION } from '../join.utils';
import { rightOptions, withCondition, withoutRightColumns } from './joinDialog.utils';

const graph = etlGraphFromLeaves(etlJobFromJson(fixture.etlGetV1.response).operators);
const form = { conditions: [{ ...EMPTY_CONDITION, left: 'a', right: 'b' }, EMPTY_CONDITION], joinType: 'left' as const };

describe('rightOptions', () => {
  it('lists the other tables, those without a built preview disabled', () => {
    const options = rightOptions(graph, 'sales', new Map([['sales_copy', { status: 'ready' as const }]]));

    expect(options.map(option => option.value)).toEqual(['sales_copy', 'sales_join_sales_copy', 'sales_1', 'sales_1_1', 'sales_1_2']);
    expect(options[0]).toEqual({ value: 'sales_copy', label: 'di6_probe_newdb.sales_copy', disabled: false });
    expect(options.slice(1).every(option => option.disabled)).toBe(true);
  });
});

describe('withoutRightColumns', () => {
  it('clears the right column of every condition', () => {
    expect(withoutRightColumns(form).conditions.map(condition => [condition.left, condition.right])).toEqual([
      ['a', undefined],
      [undefined, undefined]
    ]);
    expect(form.conditions[0]?.right).toBe('b');
  });
});

describe('withCondition', () => {
  it('changes one condition', () => {
    const changed = withCondition(form, 1, { left: 'x' });

    expect(changed.conditions[1]).toEqual({ ...EMPTY_CONDITION, left: 'x' });
    expect(changed.conditions[0]).toBe(form.conditions[0]);
  });
});
