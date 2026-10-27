import { withoutUndefined } from '@/core/json/json';
import { controlValuesOf, type ChartControl } from '@/core/chart-builder/chartControls';
import { ConditionFamilyType, type ConditionData } from '@/core/chart-builder/ConditionData';
import { defaultCondition, FAMILY_CONDITIONS, FilterCondition, FilterInput, inputOf, isFilterCondition } from '@/core/query/internalFilter';
import { ConditionFamily } from '@/core/schema/fieldTypes';

const FAMILIES: Readonly<Record<string, ConditionFamily>> = {
  [ConditionFamilyType.String]: ConditionFamily.String,
  [ConditionFamilyType.Number]: ConditionFamily.Number,
  [ConditionFamilyType.Date]: ConditionFamily.Date
};

/** The conditions a filter condition can take, from its `family_type`. */
export function familyOfCondition(condition: ConditionData): ConditionFamily | undefined {
  return FAMILIES[condition.familyType];
}

export function conditionChoicesOf(family: ConditionFamily | undefined): readonly FilterCondition[] {
  return family ? FAMILY_CONDITIONS[family] : [];
}

/** v1 `SelectionInput.ValueTypeOptions`: values typed in, or taken from a chart control of the dashboard. */
export type ValueMode = 'manual' | 'control';

/** What the editor changes before Apply (v1 `InternalFilterPopover.currentFilter`). */
export interface ConditionDraft {
  readonly condition: FilterCondition;
  readonly mode: ValueMode;
  /** Values typed in or picked, or the control's value types in control mode. */
  readonly values: readonly string[];
  readonly controlId?: number;
}

export function draftOf(data: ConditionData): ConditionDraft {
  const family = familyOfCondition(data);
  const condition = isFilterCondition(data.subType) && conditionChoicesOf(family).includes(data.subType) ? data.subType : defaultCondition(family);
  const mode = data.controlId === undefined ? 'manual' : 'control';
  return withoutUndefined({ condition, mode, values: data.allValues, controlId: data.controlId });
}

/** Whether a condition can take its values from a control: one that takes values at all (v1 `hideControlConfig`). */
export function canUseControl(family: ConditionFamily | undefined, condition: FilterCondition): boolean {
  return inputOf(family, condition) !== FilterInput.None;
}

/** Another condition picked: values stay while they fit what it takes; one taking none can't use a control. */
export function withDraftCondition(draft: ConditionDraft, family: ConditionFamily | undefined, condition: FilterCondition): ConditionDraft {
  const keep = inputOf(family, condition) === inputOf(family, draft.condition);
  if (!canUseControl(family, condition)) return { condition, mode: 'manual', values: keep ? draft.values : [] };
  return { ...draft, condition, values: keep ? draft.values : [] };
}

/** Another mode or control: the values of one mean nothing in the other. */
export function withDraftControl(draft: ConditionDraft, mode: ValueMode, controlId?: number): ConditionDraft {
  return withoutUndefined({ condition: draft.condition, mode, values: [], controlId: mode === 'control' ? controlId : undefined });
}

/** What Apply keeps of the values: no blanks, both ends of a range in place, one value for the others. */
function appliedValues(input: FilterInput, values: readonly string[]): string[] {
  const trimmed = values.map(value => value.trim());
  switch (input) {
    case FilterInput.None:
      return [];
    case FilterInput.MultiSelect:
      return trimmed.filter(value => value !== '');
    case FilterInput.NumberRange:
    case FilterInput.DateRange:
      return trimmed.slice(0, 2);
    default:
      return trimmed[0] ? [trimmed[0]] : [];
  }
}

/** v1's mode for a number or date list condition was Selection, so v1 reopens it with its list (v1 `FilterMode`). */
function filterModeOf(family: ConditionFamily | undefined, condition: FilterCondition): string {
  const isList = condition === FilterCondition.In || condition === FilterCondition.NotIn;
  return isList && family !== ConditionFamily.String ? 'selection' : 'range';
}

/** The condition as Apply saves it (v1 `FilterItem.buildNodeFromFilter`), in the keys v1 reads back. */
export function appliedCondition(data: ConditionData, draft: ConditionDraft): ConditionData {
  const family = familyOfCondition(data);
  const input = inputOf(family, draft.condition);
  const values = appliedValues(input, draft.values);
  const controlId = draft.mode === 'control' && input !== FilterInput.None ? draft.controlId : undefined;
  return withoutUndefined<ConditionData>({
    ...data,
    subType: draft.condition,
    currentOptionSelected: draft.condition,
    currentInputType: input,
    filterModeSelected: filterModeOf(family, draft.condition),
    allValues: values,
    firstValue: values[0],
    secondValue: values[1],
    controlId
  });
}

/** The controls a condition can take values from: those with values to give (v1 `FilterItem.chartControls`). */
export function valueControlsOf(controls: readonly ChartControl[]): ChartControl[] {
  return controls.filter(control => controlValuesOf(control.chartType).length > 0);
}

/** What the condition shows next to its name (v1 `InternalFilterPanel.chipDataList`); none means "Click to filter". */
export function conditionChips(data: ConditionData, controls: readonly ChartControl[]): string[] {
  const input = inputOf(familyOfCondition(data), isFilterCondition(data.subType) ? data.subType : FilterCondition.In);
  if (input === FilterInput.None) return [];
  if (data.controlId !== undefined) {
    const control = controls.find(item => item.id === data.controlId);
    const labels = data.allValues.map(type => controlValuesOf(control?.chartType ?? '').find(value => value.type === type)?.label ?? type);
    const title = control?.title ?? `Chart ${data.controlId}`;
    return [labels.length > 0 ? `${title}: ${labels.join(' - ')}` : title];
  }
  const [first = '', second = ''] = data.allValues;
  switch (input) {
    case FilterInput.MultiSelect:
      return [...data.allValues];
    case FilterInput.NumberRange:
    case FilterInput.DateRange:
      return first || second ? [`${first} - ${second}`] : [];
    default:
      return first ? [first] : [];
  }
}
