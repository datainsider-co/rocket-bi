import { describe, expect, it } from 'vitest';
import { widgetFromJson } from '@/core/dashboard/Widget';
import { controlsReducer, defaultControlValues, hasChangedControls, initialControls } from './controls.utils';

const filter = (id: number, value?: unknown) =>
  widgetFromJson({
    class_name: 'chart_v3',
    id,
    setting: { options: { options: value === undefined ? {} : { default: { setting: { value } } } } }
  });

describe('defaultControlValues', () => {
  it('reads one value or a list as the selected value', () => {
    expect(defaultControlValues(filter(1, ['Asia', 'Europe']))).toEqual({ selected_value: ['Asia', 'Europe'] });
    expect(defaultControlValues(filter(1, 2020))).toEqual({ selected_value: ['2020'] });
  });

  it('has none without a default or for other widgets', () => {
    expect(defaultControlValues(filter(1))).toBeUndefined();
    expect(defaultControlValues(widgetFromJson({ class_name: 'text_widget', id: 2 }))).toBeUndefined();
  });
});

describe('controls state', () => {
  const initial = initialControls([filter(1, ['Asia']), filter(2)]);

  it('starts from the defaults', () => {
    expect(initial).toEqual({ 1: { selected_value: ['Asia'] } });
  });

  it('sets, clears and resets controls', () => {
    const changed = controlsReducer(initial, { type: 'set', id: 2, values: { selected_value: ['Fruits'] } });
    expect(changed).toEqual({ 1: { selected_value: ['Asia'] }, 2: { selected_value: ['Fruits'] } });
    expect(hasChangedControls(changed, initial)).toBe(true);
    expect(controlsReducer(changed, { type: 'reset', initial })).toBe(initial);
  });

  it('treats a cleared control without default as unchanged', () => {
    expect(hasChangedControls(controlsReducer(initial, { type: 'set', id: 2, values: {} }), initial)).toBe(false);
    expect(hasChangedControls(controlsReducer(initial, { type: 'set', id: 1, values: {} }), initial)).toBe(true);
  });
});
