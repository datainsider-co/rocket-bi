/*
 * @author: tvc12 - Thien Vi
 * @created: 12/31/20, 10:28 AM
 */

import { DateHistogramConditionTypes, FilterSelectOption, InputType, NumberConditionTypes, SelectOption, StringConditionTypes } from '@/shared';

export class FilterConstants {
  static readonly DEFAULT_SELECTED = StringConditionTypes.in;
  static readonly DEFAULT_STRING_SELECTED = StringConditionTypes.in;
  static readonly DEFAULT_NUMBER_SELECTED = NumberConditionTypes.equal;
  static readonly DEFAULT_DATE_SELECTED = DateHistogramConditionTypes.between;
  static readonly DEFAULT_RECORD_VALUE = ['___', '___', '___'];
  static readonly DEFAULT_LOAD_ITEM_SIZE = 80;

  static readonly SELECT_MODE_OPTIONS: SelectOption[] = [
    {
      id: 'range',
      displayName: 'Range'
    },
    {
      id: 'selection',
      displayName: 'Selection'
    }
  ];

  static readonly STRING_SELECTION_OPTIONS: FilterSelectOption[] = [
    {
      displayName: StringConditionTypes.in,
      id: StringConditionTypes.in,
      inputType: InputType.multiSelect
    },
    {
      displayName: StringConditionTypes.notIn,
      id: StringConditionTypes.notIn,
      inputType: InputType.multiSelect
    },
    {
      displayName: StringConditionTypes.equal,
      id: StringConditionTypes.equal,
      inputType: InputType.text
    },
    {
      displayName: StringConditionTypes.notEqual,
      id: StringConditionTypes.notEqual,
      inputType: InputType.text
    },
    {
      displayName: StringConditionTypes.isEmpty,
      id: StringConditionTypes.isEmpty,
      inputType: InputType.none
    },
    {
      displayName: StringConditionTypes.notEmpty,
      id: StringConditionTypes.notEmpty,
      inputType: InputType.none
    },
    {
      displayName: StringConditionTypes.isnull,
      id: StringConditionTypes.isnull,
      inputType: InputType.none
    },
    {
      displayName: StringConditionTypes.notNull,
      id: StringConditionTypes.notNull,
      inputType: InputType.none
    },
    {
      displayName: StringConditionTypes.matchesRegex,
      id: StringConditionTypes.matchesRegex,
      inputType: InputType.text
    },
    {
      displayName: StringConditionTypes.like,
      id: StringConditionTypes.like,
      inputType: InputType.text
    },
    {
      displayName: StringConditionTypes.notLike,
      id: StringConditionTypes.notLike,
      inputType: InputType.text
    },
    {
      displayName: StringConditionTypes.likeCaseInsensitive,
      id: StringConditionTypes.likeCaseInsensitive,
      inputType: InputType.text
    },
    {
      displayName: StringConditionTypes.notLikeCaseInsensitive,
      id: StringConditionTypes.notLikeCaseInsensitive,
      inputType: InputType.text
    }
  ];

  static readonly DATE_RANGE_OPTIONS: FilterSelectOption[] = [
    {
      displayName: DateHistogramConditionTypes.between,
      id: DateHistogramConditionTypes.between,
      inputType: InputType.dateRange
    },
    {
      displayName: DateHistogramConditionTypes.betweenAndIncluding,
      id: DateHistogramConditionTypes.betweenAndIncluding,
      inputType: InputType.dateRange
    },
    {
      displayName: DateHistogramConditionTypes.earlierThan,
      id: DateHistogramConditionTypes.earlierThan,
      inputType: InputType.date
    },
    {
      displayName: DateHistogramConditionTypes.laterThan,
      id: DateHistogramConditionTypes.laterThan,
      inputType: InputType.date
    },
    {
      displayName: DateHistogramConditionTypes.lastNMinutes,
      id: DateHistogramConditionTypes.lastNMinutes,
      inputType: InputType.text
    },
    {
      displayName: DateHistogramConditionTypes.lastNHours,
      id: DateHistogramConditionTypes.lastNHours,
      inputType: InputType.text
    },
    {
      displayName: DateHistogramConditionTypes.lastNDays,
      id: DateHistogramConditionTypes.lastNDays,
      inputType: InputType.text
    },
    {
      displayName: DateHistogramConditionTypes.lastNWeeks,
      id: DateHistogramConditionTypes.lastNWeeks,
      inputType: InputType.text
    },
    {
      displayName: DateHistogramConditionTypes.lastNMonths,
      id: DateHistogramConditionTypes.lastNMonths,
      inputType: InputType.text
    },
    {
      displayName: DateHistogramConditionTypes.lastNYears,
      id: DateHistogramConditionTypes.lastNYears,
      inputType: InputType.text
    },

    {
      displayName: DateHistogramConditionTypes.currentDay,
      id: DateHistogramConditionTypes.currentDay,
      inputType: InputType.none
    },
    {
      displayName: DateHistogramConditionTypes.currentWeek,
      id: DateHistogramConditionTypes.currentWeek,
      inputType: InputType.none
    },
    {
      displayName: DateHistogramConditionTypes.currentMonth,
      id: DateHistogramConditionTypes.currentMonth,
      inputType: InputType.none
    },
    {
      displayName: DateHistogramConditionTypes.currentQuarter,
      id: DateHistogramConditionTypes.currentQuarter,
      inputType: InputType.none
    },
    {
      displayName: DateHistogramConditionTypes.currentYear,
      id: DateHistogramConditionTypes.currentYear,
      inputType: InputType.none
    }
  ];

  static readonly DATE_SELECTION_OPTIONS: FilterSelectOption[] = [
    {
      displayName: StringConditionTypes.in,
      id: StringConditionTypes.in,
      inputType: InputType.multiSelect
    },
    {
      displayName: StringConditionTypes.notIn,
      id: StringConditionTypes.notIn,
      inputType: InputType.multiSelect
    },
    {
      displayName: StringConditionTypes.isnull,
      id: StringConditionTypes.isnull,
      inputType: InputType.none
    },
    {
      displayName: StringConditionTypes.notNull,
      id: StringConditionTypes.notNull,
      inputType: InputType.none
    }
  ];

  static readonly NUMBER_RANGE_OPTIONS: FilterSelectOption[] = [
    {
      displayName: NumberConditionTypes.equal,
      id: NumberConditionTypes.equal,
      inputType: InputType.text
    },
    {
      displayName: NumberConditionTypes.notEqual,
      id: NumberConditionTypes.notEqual,
      inputType: InputType.text
    },
    {
      displayName: NumberConditionTypes.greaterThan,
      id: NumberConditionTypes.greaterThan,
      inputType: InputType.text
    },
    {
      displayName: NumberConditionTypes.between,
      id: NumberConditionTypes.between,
      inputType: InputType.numberRange
    },
    {
      displayName: NumberConditionTypes.betweenAndIncluding,
      id: NumberConditionTypes.betweenAndIncluding,
      inputType: InputType.numberRange
    },
    {
      displayName: NumberConditionTypes.greaterThanOrEqual,
      id: NumberConditionTypes.greaterThanOrEqual,
      inputType: InputType.text
    },
    {
      displayName: NumberConditionTypes.lessThan,
      id: NumberConditionTypes.lessThan,
      inputType: InputType.text
    },
    {
      displayName: NumberConditionTypes.lessThanOrEqual,
      id: NumberConditionTypes.lessThanOrEqual,
      inputType: InputType.text
    }
  ];

  static readonly NUMBER_SELECTION_OPTIONS: FilterSelectOption[] = [
    {
      displayName: StringConditionTypes.in,
      id: StringConditionTypes.in,
      inputType: InputType.multiSelect
    },
    {
      displayName: StringConditionTypes.notIn,
      id: StringConditionTypes.notIn,
      inputType: InputType.multiSelect
    },
    {
      displayName: StringConditionTypes.isnull,
      id: StringConditionTypes.isnull,
      inputType: InputType.none
    },
    {
      displayName: StringConditionTypes.notNull,
      id: StringConditionTypes.notNull,
      inputType: InputType.none
    }
  ];
}
