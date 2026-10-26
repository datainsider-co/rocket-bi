import { describe, expect, it } from 'vitest';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { applyControlValues, controlsFor, referencedControlIds, withConditionValues } from './controlValues';

/** The column chart is filtered by the Region tab filter (widget 8) through a dynamic `in` condition. */
const columnSetting = fixture.widgets.find(widget => widget.id === 4)!.setting as Record<string, unknown>;
const field = { class_name: 'table_field', db_name: 'sample_v2', tbl_name: 'sales', field_name: 'region', field_type: 'string' };

describe('referencedControlIds', () => {
  it('finds dynamic conditions inside and/or groups', () => {
    expect([...referencedControlIds(columnSetting)]).toEqual([8]);
    expect([...referencedControlIds({ filters: [] })]).toEqual([]);
  });
});

describe('applyControlValues', () => {
  const dynamicOf = (setting: Record<string, unknown>) =>
    ((setting['filters'] as { conditions: Record<string, unknown>[] }[])[0]!.conditions[0])!;

  it('builds the final condition from the selected values', () => {
    const applied = applyControlValues(columnSetting, { 8: { selected_value: ['Asia', 'Europe'] } });
    expect(dynamicOf(applied)['final_condition']).toEqual({
      class_name: 'in',
      field,
      possible_values: ['Asia', 'Europe'],
      is_include_null: false
    });
    // The stored setting is left alone.
    expect(dynamicOf(columnSetting)['final_condition']).toBeUndefined();
  });

  it('drops the final condition when the control is cleared', () => {
    const selected = applyControlValues(columnSetting, { 8: { selected_value: ['Asia'] } });
    expect(dynamicOf(applyControlValues(selected, { 8: {} }))).not.toHaveProperty('final_condition');
  });

  it('keeps conditions of controls that were never set', () => {
    expect(applyControlValues(columnSetting, { 99: { selected_value: ['x'] } })['filters']).toEqual(columnSetting['filters']);
  });

  it('uses only the values of the condition control types', () => {
    const setting = {
      filters: [
        {
          class_name: 'dynamic_condition',
          dynamic_widget_id: 1,
          base_condition: { class_name: 'between', field, min: '', max: '' },
          extra_data: { control_types: ['min_value', 'max_value'] }
        }
      ]
    };
    const applied = applyControlValues(setting, { 1: { selected_value: ['no'], min_value: ['2020-01-01'], max_value: ['2020-12-31'] } });
    expect((applied['filters'] as Record<string, unknown>[])[0]!['final_condition']).toMatchObject({ min: '2020-01-01', max: '2020-12-31' });
  });
});

describe('withConditionValues', () => {
  it.each([
    [{ class_name: 'equal', value: '' }, ['a', 'b'], { class_name: 'equal', value: 'a' }],
    [{ class_name: 'not_in', possible_values: [] }, ['a', 'b'], { class_name: 'not_in', possible_values: ['a', 'b'] }],
    [{ class_name: 'last_n_day', n_day: 1 }, ['7'], { class_name: 'last_n_day', n_day: '7' }],
    [{ class_name: 'current_month' }, ['ignored'], { class_name: 'current_month' }]
  ])('fills %j', (base, values, expected) => {
    expect(withConditionValues(base, values)).toEqual(expected);
  });

  it('applies nothing for missing or unfitting values', () => {
    expect(withConditionValues({ class_name: 'in' }, [])).toBeUndefined();
    expect(withConditionValues({ class_name: 'between' }, ['only-min'])).toBeUndefined();
    expect(withConditionValues({ class_name: 'unknown' }, ['a'])).toBeUndefined();
  });
});

describe('controlsFor', () => {
  it('picks the controls the setting depends on, not itself', () => {
    const controls = { 8: { selected_value: ['Asia'] }, 9: { selected_value: ['Fruits'] } };
    expect(controlsFor(columnSetting, 4, controls)).toEqual({ 8: { selected_value: ['Asia'] } });
    expect(controlsFor(columnSetting, 8, controls)).toEqual({});
  });
});
