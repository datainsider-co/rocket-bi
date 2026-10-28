import { describe, expect, it } from 'vitest';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import { conditionDataFromJson, newConditionData, type ConditionData } from '@/core/chart-builder/ConditionData';
import stored from '@/core/chart-builder/builder.fixture.json';
import { ConditionFamily } from '@/core/schema/fieldTypes';
import {
  appliedCondition,
  canUseControl,
  conditionChips,
  conditionChoicesOf,
  draftOf,
  familyOfCondition,
  valueControlsOf,
  withDraftCondition,
  withDraftControl,
  type ConditionDraft
} from './conditionEditor.utils';

const field = (type: string) => ({ class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'col', field_type: type });

const fresh = (type: string): ConditionData => newConditionData({ id: 1, groupId: 1, field: field(type), columnName: 'col', tableName: 'sales' });

/** A condition the CB0 fixture holds, by widget id. */
const storedCondition = (widgetId: number): ConditionData => {
  const widget = stored.widgets.find(item => item.id === widgetId);
  const groups = Object.values((widget?.extra_data as { filters?: Record<string, unknown[]> } | undefined)?.filters ?? {});
  return conditionDataFromJson(groups[0]?.[0]);
};

const controls: ChartControl[] = [
  { id: 31, title: 'Region', chartType: 'tab_filter', infoType: 'Normal', data: {} },
  { id: -1, title: 'Main Date Filter', chartType: 'date_select_filter', infoType: 'Normal', data: {} },
  { id: 40, title: 'Revenue', chartType: 'kpi', infoType: 'Normal', data: {} }
];

describe('familyOfCondition and conditionChoicesOf', () => {
  it.each([
    ['string', ConditionFamily.String],
    ['double', ConditionFamily.Number],
    ['datetime', ConditionFamily.Date]
  ])('reads the family of a %s condition', (type, family) => {
    expect(familyOfCondition(fresh(type))).toBe(family);
  });

  it('has no family nor choices for an unknown family type', () => {
    const family = familyOfCondition({ ...fresh('string'), familyType: 'geo' });
    expect(family).toBeUndefined();
    expect(conditionChoicesOf(family)).toEqual([]);
  });

  it('lists the conditions of a family', () => {
    expect(conditionChoicesOf(ConditionFamily.String)[0]).toBe('in');
  });
});

describe('draftOf', () => {
  it('reads a stored condition and its values', () => {
    expect(draftOf(storedCondition(31))).toEqual({ condition: 'in', mode: 'manual', values: ['Asia', 'Europe'] });
  });

  it('reads a condition on a chart control', () => {
    expect(draftOf(storedCondition(48))).toEqual({ condition: 'in', mode: 'control', values: [], controlId: 31 });
  });

  it("falls back to the family's default for a condition it does not know", () => {
    expect(draftOf({ ...fresh('double'), subType: 'like' }).condition).toBe('equal');
    expect(draftOf({ ...fresh('double'), subType: undefined }).condition).toBe('equal');
  });
});

describe('canUseControl', () => {
  it('needs a condition taking values', () => {
    expect(canUseControl(ConditionFamily.String, 'in')).toBe(true);
    expect(canUseControl(ConditionFamily.String, 'is null')).toBe(false);
  });
});

describe('withDraftCondition', () => {
  const draft: ConditionDraft = { condition: 'in', mode: 'control', values: ['selected_value'], controlId: 31 };

  it('keeps the values while they fit', () => {
    expect(withDraftCondition(draft, ConditionFamily.String, 'not in')).toEqual({ ...draft, condition: 'not in' });
  });

  it('drops the values that do not fit', () => {
    expect(withDraftCondition(draft, ConditionFamily.String, 'equal')).toEqual({ ...draft, condition: 'equal', values: [] });
  });

  it('goes back to manual values for a condition taking none', () => {
    expect(withDraftCondition(draft, ConditionFamily.String, 'is null')).toEqual({ condition: 'is null', mode: 'manual', values: [] });
  });
});

describe('withDraftControl', () => {
  const draft: ConditionDraft = { condition: 'in', mode: 'manual', values: ['Asia'] };

  it('switches to a control without values', () => {
    expect(withDraftControl(draft, 'control', 31)).toEqual({ condition: 'in', mode: 'control', values: [], controlId: 31 });
    expect(withDraftControl(draft, 'control')).toEqual({ condition: 'in', mode: 'control', values: [] });
  });

  it('switches back to manual values without the control', () => {
    expect(withDraftControl({ ...draft, mode: 'control', controlId: 31 }, 'manual', 31)).toEqual({ condition: 'in', mode: 'manual', values: [] });
  });
});

describe('appliedCondition', () => {
  it('saves a list as v1 did', () => {
    const saved = appliedCondition(fresh('string'), { condition: 'in', mode: 'manual', values: [' Asia ', '', 'Europe'] });
    expect(saved).toMatchObject({
      subType: 'in',
      currentOptionSelected: 'in',
      currentInputType: 'multi_select',
      filterModeSelected: 'range',
      allValues: ['Asia', 'Europe'],
      firstValue: 'Asia',
      secondValue: 'Europe'
    });
    expect(saved).not.toHaveProperty('controlId');
  });

  it('gives saved values back as the stored condition had them', () => {
    const condition = storedCondition(31);
    expect(appliedCondition(condition, draftOf(condition))).toEqual(condition);
  });

  it('keeps one value, or both ends of a range', () => {
    expect(appliedCondition(fresh('double'), { condition: 'equal', mode: 'manual', values: ['5', '7'] })).toMatchObject({ allValues: ['5'], firstValue: '5', currentInputType: 'text' });
    expect(appliedCondition(fresh('double'), { condition: 'equal', mode: 'manual', values: [' '] })).not.toHaveProperty('firstValue');
    expect(appliedCondition(fresh('double'), { condition: 'between', mode: 'manual', values: ['1', ''] })).toMatchObject({ allValues: ['1', ''], currentInputType: 'number_range' });
  });

  it('marks a number or date list as v1 Selection mode', () => {
    expect(appliedCondition(fresh('double'), { condition: 'in', mode: 'manual', values: ['1'] }).filterModeSelected).toBe('selection');
    expect(appliedCondition(fresh('datetime'), { condition: 'between', mode: 'manual', values: [] }).filterModeSelected).toBe('range');
  });

  it('drops the values of a condition taking none', () => {
    expect(appliedCondition(storedCondition(31), { condition: 'is null', mode: 'manual', values: ['Asia'] })).toMatchObject({ allValues: [], currentInputType: 'none' });
  });

  it('keeps the control and its value types in control mode', () => {
    const saved = appliedCondition(fresh('string'), { condition: 'in', mode: 'control', values: ['selected_value'], controlId: 31 });
    expect(saved).toMatchObject({ controlId: 31, allValues: ['selected_value'] });
  });

  it('drops a control picked for a condition taking no values', () => {
    expect(appliedCondition(storedCondition(48), { condition: 'is null', mode: 'control', values: [], controlId: 31 })).not.toHaveProperty('controlId');
  });
});

describe('valueControlsOf', () => {
  it('keeps the controls with values to give', () => {
    expect(valueControlsOf(controls).map(control => control.id)).toEqual([31, -1]);
  });
});

describe('conditionChips', () => {
  const condition = (overrides: Partial<ConditionData>): ConditionData => ({ ...fresh('string'), ...overrides });

  it('shows each value of a list', () => {
    expect(conditionChips(storedCondition(31), controls)).toEqual(['Asia', 'Europe']);
  });

  it('shows a range as one chip, or none while empty', () => {
    expect(conditionChips({ ...fresh('double'), subType: 'between', allValues: ['1', '5'] }, controls)).toEqual(['1 - 5']);
    expect(conditionChips({ ...fresh('double'), subType: 'between', allValues: [] }, controls)).toEqual([]);
  });

  it('shows one value, or none', () => {
    expect(conditionChips(condition({ subType: 'like', allValues: ['As%'] }), controls)).toEqual(['As%']);
    expect(conditionChips(condition({ subType: 'like', allValues: [] }), controls)).toEqual([]);
  });

  it('shows nothing for a condition taking no value', () => {
    expect(conditionChips(condition({ subType: 'is null', allValues: ['x'] }), controls)).toEqual([]);
  });

  it("shows the control and its values' labels", () => {
    expect(conditionChips(condition({ controlId: 31, allValues: ['selected_value'] }), controls)).toEqual(['Region: Selected value']);
    expect(conditionChips({ ...fresh('datetime'), subType: 'between', controlId: -1, allValues: ['min_value', 'max_value'] }, controls)).toEqual([
      'Main Date Filter: Start date - End date'
    ]);
  });

  it('shows a control without values, or one gone from the dashboard', () => {
    expect(conditionChips(condition({ controlId: 31, allValues: [] }), controls)).toEqual(['Region']);
    expect(conditionChips(condition({ controlId: 99, allValues: ['selected_value'] }), controls)).toEqual(['Chart 99: Selected value']);
  });
});
