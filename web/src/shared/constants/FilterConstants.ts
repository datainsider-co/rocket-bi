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

  static readonly STRING_SELECTION_OPTIONS: FilterSelectOption[] = [
    {
      displayName: StringConditionTypes.in,
      id: StringConditionTypes.in,
      inputType: InputType.MultiSelect
    },
    {
      displayName: StringConditionTypes.notIn,
      id: StringConditionTypes.notIn,
      inputType: InputType.MultiSelect
    },
    {
      displayName: StringConditionTypes.equal,
      id: StringConditionTypes.equal,
      inputType: InputType.Text
    },
    {
      displayName: StringConditionTypes.notEqual,
      id: StringConditionTypes.notEqual,
      inputType: InputType.Text
    },
    {
      displayName: StringConditionTypes.isEmpty,
      id: StringConditionTypes.isEmpty,
      inputType: InputType.None
    },
    {
      displayName: StringConditionTypes.notEmpty,
      id: StringConditionTypes.notEmpty,
      inputType: InputType.None
    },
    {
      displayName: StringConditionTypes.isnull,
      id: StringConditionTypes.isnull,
      inputType: InputType.None
    },
    {
      displayName: StringConditionTypes.notNull,
      id: StringConditionTypes.notNull,
      inputType: InputType.None
    },
    {
      displayName: StringConditionTypes.matchesRegex,
      id: StringConditionTypes.matchesRegex,
      inputType: InputType.Text
    },
    {
      displayName: StringConditionTypes.like,
      id: StringConditionTypes.like,
      inputType: InputType.Text
    },
    {
      displayName: StringConditionTypes.notLike,
      id: StringConditionTypes.notLike,
      inputType: InputType.Text
    },
    {
      displayName: StringConditionTypes.likeCaseInsensitive,
      id: StringConditionTypes.likeCaseInsensitive,
      inputType: InputType.Text
    },
    {
      displayName: StringConditionTypes.notLikeCaseInsensitive,
      id: StringConditionTypes.notLikeCaseInsensitive,
      inputType: InputType.Text
    }
  ];

  static readonly DATE_SELECTION_OPTIONS: FilterSelectOption[] = [
    {
      displayName: StringConditionTypes.in,
      id: StringConditionTypes.in,
      inputType: InputType.MultiSelect
    },
    {
      displayName: StringConditionTypes.notIn,
      id: StringConditionTypes.notIn,
      inputType: InputType.MultiSelect
    },
    {
      displayName: StringConditionTypes.isnull,
      id: StringConditionTypes.isnull,
      inputType: InputType.None
    },
    {
      displayName: StringConditionTypes.notNull,
      id: StringConditionTypes.notNull,
      inputType: InputType.None
    }
  ];

  static readonly NUMBER_SELECTION_OPTIONS: FilterSelectOption[] = [
    {
      displayName: StringConditionTypes.in,
      id: StringConditionTypes.in,
      inputType: InputType.MultiSelect
    },
    {
      displayName: StringConditionTypes.notIn,
      id: StringConditionTypes.notIn,
      inputType: InputType.MultiSelect
    },
    {
      displayName: StringConditionTypes.isnull,
      id: StringConditionTypes.isnull,
      inputType: InputType.None
    },
    {
      displayName: StringConditionTypes.notNull,
      id: StringConditionTypes.notNull,
      inputType: InputType.None
    }
  ];
}
