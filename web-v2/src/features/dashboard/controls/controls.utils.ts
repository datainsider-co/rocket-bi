import type { Widget } from '@/core/dashboard/Widget';
import { getPath } from '@/core/json/json';
import { ValueControlType, type ControlValueMap, type ControlValues } from '@/core/query/controlValues';

/**
 * The default selection of a chart used as a control (v1 `TabFilterOption.getDefaultValueAsMap`):
 * `options.default.setting.value`, one value or a list. Stored snake_case, read raw here like the rest of the setting.
 */
export function defaultControlValues(widget: Widget): ControlValues | undefined {
  if (widget.kind !== 'chart') return undefined;
  const value = getPath(widget.setting, ['options', 'options', 'default', 'setting', 'value']);
  if (value === null || value === undefined) return undefined;
  const values = (Array.isArray(value) ? value : [value]).map(String);
  return { [ValueControlType.SelectedValue]: values };
}

/** Starting values of every control on the dashboard (v1 `QuerySettingStore.init`). */
export function initialControls(widgets: readonly Widget[]): ControlValueMap {
  const controls: Record<number, ControlValues> = {};
  for (const widget of widgets) {
    const values = defaultControlValues(widget);
    if (values) controls[widget.id] = values;
  }
  return controls;
}

export type ControlsAction =
  | { type: 'set'; id: number; values: ControlValues }
  | { type: 'reset'; initial: ControlValueMap };

export function controlsReducer(state: ControlValueMap, action: ControlsAction): ControlValueMap {
  switch (action.type) {
    case 'set':
      return { ...state, [action.id]: action.values };
    case 'reset':
      return action.initial;
  }
}

function sameValues(a: ControlValues | undefined, b: ControlValues | undefined): boolean {
  const types = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]) as Set<ValueControlType>;
  return [...types].every(type => {
    const left = a?.[type] ?? [];
    const right = b?.[type] ?? [];
    return left.length === right.length && left.every((value, index) => value === right[index]);
  });
}

/** Whether any control moved away from its default (shows Reset Filters). */
export function hasChangedControls(state: ControlValueMap, initial: ControlValueMap): boolean {
  const ids = new Set([...Object.keys(state), ...Object.keys(initial)].map(Number));
  return [...ids].some(id => !sameValues(state[id], initial[id]));
}
