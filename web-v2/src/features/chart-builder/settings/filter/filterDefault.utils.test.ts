import { describe, expect, it } from 'vitest';
import stored from '@/core/chart-builder/builder.fixture.json';
import { applyVizChanges, vizOptionsOf } from '@/core/chart-builder/vizChanges';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { asRecord, getPath, type JsonObject } from '@/core/json/json';
import { defaultControlValues, type ControlEntry } from '@/features/dashboard/controls/controls.utils';
import { canSaveDefault, defaultChanges, defaultSummaryOf, filterDefaultOf, storedDefaultOf } from './filterDefault.utils';

const settingOf = (id: number): JsonObject => {
  const found = stored.widgets.find(item => item.id === id);
  if (!found) throw new Error(`no widget ${id}`);
  return asRecord(found.setting);
};

const TAB = 39;
const SLICER = 43;
const DATE = 44;
const INPUT = 45;
const TREE = 46;
const now = new Date(2026, 9, 28);

/** The setting with the default saved, and what the dashboard reads back from it. */
function roundTrip(id: number, entry: ControlEntry) {
  const setting = settingOf(id);
  const next = { ...setting, options: applyVizChanges(asRecord(setting['options']), defaultChanges(filterDefaultOf(setting, entry) ?? null)) };
  const widget: ChartWidget = { kind: 'chart', id, name: '', description: '', json: {}, setting: next };
  return { next, read: defaultControlValues(widget, now) };
}

describe('filterDefaultOf', () => {
  it('waits for a pick in the preview', () => {
    expect(filterDefaultOf(settingOf(TAB), undefined)).toBeUndefined();
  });

  it("saves a tab filter's values with v1's in condition", () => {
    const value = filterDefaultOf(settingOf(TAB), { selected_value: ['Asia', 'Europe'] });
    expect(value?.value).toEqual(['Asia', 'Europe']);
    expect(value?.conditions).toMatchObject({ class_name: 'in', possible_values: ['Asia', 'Europe'], field: { field_name: expect.any(String) as string } });
  });

  it('saves no default for All', () => {
    expect(filterDefaultOf(settingOf(TAB), {})).toBeNull();
    expect(filterDefaultOf(settingOf(SLICER), {})).toBeNull();
    expect(filterDefaultOf(settingOf(DATE), { mode: 'all_time' })).toBeNull();
    expect(filterDefaultOf(settingOf(TREE), { keys: [] })).toBeNull();
    expect(filterDefaultOf(settingOf(INPUT), {})).toBeNull();
  });

  it("saves a function control's keys without condition", () => {
    const setting = settingOf(TAB);
    const control = { ...setting, values: [...(setting['values'] as JsonObject[]), ...(setting['values'] as JsonObject[])] };
    expect(filterDefaultOf(control, { selected_value: ['k1'] })).toEqual({ value: ['k1'] });
  });

  it('has none for a chart that is not a filter', () => {
    expect(filterDefaultOf({ options: { class_name: 'number_chart_setting' } }, { selected_value: ['1'] })).toBeUndefined();
  });

  it.each([
    ['tab filter', TAB, { selected_value: ['Asia', 'Europe'] }],
    ['slicer', SLICER, { min_value: ['10'], max_value: ['20'] }],
    ['date select (custom)', DATE, { mode: 'custom', min_value: ['2026-01-01 00:00:00'], max_value: ['2026-02-01 23:59:59'] }],
    ['input', INPUT, { selected_value: ['Asia'] }]
  ] as const)('reads a %s default back as the same selection', (_name, id, entry) => {
    expect(roundTrip(id, entry).read).toEqual(entry);
  });

  it("reads a tree default back with its keys, keeping the stored expanded keys", () => {
    const { next, read } = roundTrip(TREE, { keys: ['0-0'], selected_value: ['x'] });
    expect(read?.keys).toEqual(['0-0']);
    expect(getPath(next, ['options', 'options', 'default', 'setting', 'value'])).toEqual({ selected_keys: ['0-0'], expanded_keys: [] });
  });
});

describe('defaultChanges', () => {
  it('saves or drops the default', () => {
    expect(defaultChanges({ value: ['a'] })).toEqual({ 'default.setting': { value: ['a'] } });
    expect(defaultChanges(null)).toEqual({ 'default.setting': null });
  });
});

describe('storedDefaultOf / canSaveDefault', () => {
  const viz = vizOptionsOf({ options: { default: { setting: { value: ['Asia'] } } } });

  it('reads the stored value', () => {
    expect(storedDefaultOf(viz)).toEqual(['Asia']);
    expect(storedDefaultOf(vizOptionsOf({ options: { default: { setting: {} } } }))).toBeNull();
  });

  it('saves only what changes the default', () => {
    expect(canSaveDefault({ value: ['Asia'] }, viz)).toBe(false);
    expect(canSaveDefault({ value: ['Europe'] }, viz)).toBe(true);
    expect(canSaveDefault(null, viz)).toBe(true);
    expect(canSaveDefault(null, vizOptionsOf({}))).toBe(false);
    expect(canSaveDefault(undefined, viz)).toBe(false);
  });
});

describe('defaultSummaryOf', () => {
  it.each([
    [null, 'None'],
    [[], 'None'],
    [['Asia', 'Europe'], 'Asia, Europe'],
    ['Asia', 'Asia'],
    [{ mode: 'last_7_days', dates: [] }, 'last 7 days'],
    [{ mode: 'custom', dates: ['2026-01-01', '2026-02-01'] }, '2026-01-01 - 2026-02-01'],
    [{ selectedKeys: ['a', 'b'], expandedKeys: [] }, '2 selected'],
    [{ selectedKeys: [] }, 'None']
  ])('%j → %s', (value, summary) => {
    expect(defaultSummaryOf(value)).toBe(summary);
  });
});
