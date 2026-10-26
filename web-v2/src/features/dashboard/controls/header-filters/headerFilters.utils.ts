import {
  defaultCondition,
  FAMILY_CONDITIONS,
  familyOf,
  FilterInput,
  inputOf,
  type FilterCondition,
  type InternalFilter
} from '@/core/query/internalFilter';

/** What the filter shows of its values (v1 `InternalFilterPanel.getNormalChipDataList`); none means "Click to filter". */
export function filterChips(filter: InternalFilter): string[] {
  const [first = '', second = ''] = filter.values;
  switch (inputOf(familyOf(filter), filter.condition)) {
    case FilterInput.None:
      return [filter.condition];
    case FilterInput.MultiSelect:
      return filter.values.filter(value => value !== '');
    case FilterInput.NumberRange:
    case FilterInput.DateRange:
      return first || second ? [`${first} - ${second}`] : [];
    default:
      return first ? [first] : [];
  }
}

/**
 * The filter without the chip at `index` (v1 `handleRemoveChipAt`): one value of a list, else every value, and a
 * condition that takes none goes back to the family's default.
 */
export function withoutChip(filter: InternalFilter, index: number): InternalFilter {
  const family = familyOf(filter);
  const input = inputOf(family, filter.condition);
  if (input === FilterInput.MultiSelect) return { ...filter, values: filter.values.filter((_value, at) => at !== index) };
  return { ...filter, values: [], condition: input === FilterInput.None ? defaultCondition(family) : filter.condition };
}

/** One line per filter in the chart's filter list (v1 `FilterListingItem`: the condition and its values). */
export function describeFilter(filter: InternalFilter): string {
  const input = inputOf(familyOf(filter), filter.condition);
  return input === FilterInput.None ? filter.condition : `${filter.condition} ${filterChips(filter).join(', ')}`;
}

/** The conditions the editor offers for the filter's field. */
export function conditionOptions(filter: InternalFilter): { value: FilterCondition; label: string }[] {
  const family = familyOf(filter);
  return (family ? FAMILY_CONDITIONS[family] : []).map(condition => ({ value: condition, label: condition }));
}

/** The draft after picking another condition: values stay while they fit what it takes. */
export function withCondition(filter: InternalFilter, condition: FilterCondition): InternalFilter {
  const family = familyOf(filter);
  const keep = inputOf(family, condition) === inputOf(family, filter.condition);
  return { ...filter, condition, values: keep ? filter.values : [] };
}

/** What Apply keeps: values without blanks, both ends of a range in place. */
export function appliedFilter(draft: InternalFilter): InternalFilter {
  const input = inputOf(familyOf(draft), draft.condition);
  if (input === FilterInput.None) return { ...draft, values: [] };
  if (input === FilterInput.NumberRange || input === FilterInput.DateRange) return { ...draft, values: draft.values.slice(0, 2).map(value => value.trim()) };
  if (input === FilterInput.MultiSelect) return { ...draft, values: draft.values.map(value => value.trim()).filter(value => value !== '') };
  const first = draft.values[0]?.trim() ?? '';
  return { ...draft, values: first ? [first] : [] };
}
