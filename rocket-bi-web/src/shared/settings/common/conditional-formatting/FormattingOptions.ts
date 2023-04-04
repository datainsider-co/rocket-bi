/*
 * @author: tvc12 - Thien Vi
 * @created: 7/6/21, 7:30 PM
 */

import { AggregationFunctionTypes, SelectOption } from '@/shared';
import {
  ApplyToType,
  ColorFormatting,
  ConditionalFormattingType,
  DefaultValueFormattingType,
  Field,
  FunctionType,
  IconFormatting,
  IconStyle,
  Rule,
  RuleType,
  TableField,
  TableSchema,
  ValueColorFormattingType,
  ValueType
} from '@core/common/domain';
import { ChartUtils, ListUtils, RandomUtils } from '@/utils';
import { DropdownData, DropdownType } from '@/shared/components/common/di-dropdown';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { Log } from '@core/utils';

export enum FunctionFormattingType {
  GroupBy = 'group_by',
  None = 'none'
}

export enum RulePickerType {
  Color = 'color',
  Icon = 'icon'
}

export class FormattingOptions {
  static readonly FormatByOptions: SelectOption[] = [
    {
      id: ConditionalFormattingType.ColorScale,
      displayName: 'Color Scale'
    },
    {
      id: ConditionalFormattingType.Rules,
      displayName: 'Rules'
    },
    {
      id: ConditionalFormattingType.FieldValue,
      displayName: 'Field value'
    }
  ];

  static readonly IconLayoutOptions: SelectOption[] = [
    {
      id: 'left',
      displayName: 'Left of data'
    },
    {
      id: 'only_icon',
      displayName: 'Icon only'
    },
    {
      id: 'right',
      displayName: 'Right of data'
    }
  ];
  static readonly IconOptions: SelectOption[] = [
    {
      id: IconStyle.Default,
      displayName: '🔴 🔶 🟢',
      data: [
        FormattingOptions.createIconRule(0, 33, '🔴'),
        FormattingOptions.createIconRule(33, 67, '🔶'),
        FormattingOptions.createIconRule(67, 100, '🟢', true)
      ]
    },
    {
      id: IconStyle.Style1,
      displayName: '❌ ⚠️ ✅',
      data: [
        FormattingOptions.createIconRule(0, 33, '❌'),
        FormattingOptions.createIconRule(33, 67, '⚠️'),
        FormattingOptions.createIconRule(67, 100, '✅', true)
      ]
    },
    {
      id: IconStyle.Style2,
      displayName: '🔴 🟡 🟢',
      data: [
        FormattingOptions.createIconRule(0, 33, '🔴'),
        FormattingOptions.createIconRule(33, 67, '🟡'),
        FormattingOptions.createIconRule(67, 100, '🟢', true)
      ]
    },
    {
      id: IconStyle.Style3,
      displayName: '⚫️ 🔴 🟡 🟢',
      data: [
        FormattingOptions.createIconRule(0, 25, '⚫'),
        FormattingOptions.createIconRule(25, 50, '🔴️'),
        FormattingOptions.createIconRule(50, 75, '🟡'),
        FormattingOptions.createIconRule(75, 100, '🟢', true)
      ]
    },
    {
      id: IconStyle.Style4,
      displayName: '⬛️️ 🟥 🟨 🟩',
      data: [
        FormattingOptions.createIconRule(0, 25, '⬛️️'),
        FormattingOptions.createIconRule(25, 50, '🟥️'),
        FormattingOptions.createIconRule(50, 75, '🟨'),
        FormattingOptions.createIconRule(75, 100, '🟩', true)
      ]
    },
    {
      id: IconStyle.Style5,
      displayName: '⬇️ ➡️ ⬆️',
      data: [
        FormattingOptions.createIconRule(0, 33, '⬇️'),
        FormattingOptions.createIconRule(33, 67, '➡️️'),
        FormattingOptions.createIconRule(67, 100, '⬆️', true)
      ]
    }
  ];
  static readonly IconAlignmentOptions: SelectOption[] = [
    {
      id: 'top',
      displayName: 'Top'
    },
    {
      id: 'center',
      displayName: 'Middle'
    },
    {
      id: 'bottom',
      displayName: 'Bottom'
    }
  ];
  static readonly IconFormatByOptions: SelectOption[] = [
    {
      id: ConditionalFormattingType.Rules,
      displayName: 'Rules'
    },
    {
      id: ConditionalFormattingType.FieldValue,
      displayName: 'Field value'
    }
  ];
  static readonly ApplyToOptions: SelectOption[] = [
    {
      id: ApplyToType.ValuesOnly,
      displayName: 'Values only'
    },
    {
      id: ApplyToType.ValueAndTotals,
      displayName: 'Value and totals'
    },
    {
      id: ApplyToType.TotalsOnly,
      displayName: 'Totals only'
    }
  ];
  static readonly DefaultFormattingOptions: SelectOption[] = [
    {
      id: DefaultValueFormattingType.None,
      displayName: "Don't format"
    },
    {
      id: DefaultValueFormattingType.AsZero,
      displayName: 'As zero'
    },
    {
      id: DefaultValueFormattingType.SpecificColor,
      displayName: 'Specific color'
    }
  ];
  static readonly SummarizationForNumber: SelectOption[] = [
    {
      id: FunctionType.Sum,
      displayName: AggregationFunctionTypes.sum
    },
    {
      id: FunctionType.Avg,
      displayName: AggregationFunctionTypes.average
    },
    {
      id: FunctionType.Min,
      displayName: AggregationFunctionTypes.minimum
    },
    {
      id: FunctionType.Max,
      displayName: AggregationFunctionTypes.maximum
    },
    {
      id: FunctionType.Count,
      displayName: AggregationFunctionTypes.countAll
    },
    {
      id: FunctionType.CountDistinct,
      displayName: AggregationFunctionTypes.countOfDistinct
    },
    {
      id: FunctionType.Expression,
      displayName: AggregationFunctionTypes.Expression
    }
  ];
  static readonly SummarizationForString: SelectOption[] = [
    {
      id: FunctionType.Count,
      displayName: AggregationFunctionTypes.countAll
    },
    {
      id: FunctionType.CountDistinct,
      displayName: AggregationFunctionTypes.countOfDistinct
    }
  ];
  static readonly SummarizationForDate: SelectOption[] = [
    {
      id: FunctionType.Count,
      displayName: AggregationFunctionTypes.countAll
    },
    {
      id: FunctionType.CountDistinct,
      displayName: AggregationFunctionTypes.countOfDistinct
    }
  ];
  static readonly SummarizationForFieldValue: SelectOption[] = [
    {
      id: FunctionType.First,
      displayName: AggregationFunctionTypes.First
    },
    {
      id: FunctionType.Last,
      displayName: AggregationFunctionTypes.Last
    }
  ];
  private static IconAsString =
    // eslint-disable-next-line max-len
    '🅰 ️🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕️ 🛑 ⛔️ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗️ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 〽️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯️ 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿️ 🅿️ 🛗 🈳 🈂️ 🛂 🛃 🛄 🛅 🚹 🚺 🚼 ⚧ 🚻 🚮 🎦 📶 🈁 🔣 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔢 #️⃣ *️⃣ ⏏️ ▶️ ⏸ ⏯ ⏹ ⏺ ⏭ ⏮ ⏩ ⏪ ⏫ ⏬ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️ 🔀 🔁 🔂 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ ♾ 💲 💱 ™️ ©️ ®️ 〰️ ➰ ➿ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 ⚫️ ⚪️ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ▪️ ▫️ ◾️ ◽️ ◼️ ◻️ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛️ ⬜️ 🟫 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 👁‍🗨 💬 💭 🗯 ♠️ ♣️ ♥️ ♦️ 🃏 🎴 🀄️ 🕐 🕑 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛 🕜 🕝 🕞 🕟 🕠 🕡 🕢 🕣 🕤 🕥 🕦 🕧';

  static getIcons() {
    return FormattingOptions.IconAsString.split(' ');
  }

  static getSummarizationOptions(formatType: ConditionalFormattingType, field: Field): SelectOption[] {
    if (formatType === ConditionalFormattingType.FieldValue) {
      return FormattingOptions.SummarizationForFieldValue;
    }

    if (ChartUtils.isNumberType(field.fieldType)) {
      return FormattingOptions.SummarizationForNumber;
    }

    if (ChartUtils.isDateType(field.fieldType)) {
      return FormattingOptions.SummarizationForDate;
    }

    return FormattingOptions.SummarizationForString;
  }

  static getDefaultSelectedSummarization(formatType: ConditionalFormattingType, functionFormattingType: FunctionFormattingType, field: Field): FunctionType {
    if (formatType === ConditionalFormattingType.FieldValue) {
      switch (functionFormattingType) {
        case FunctionFormattingType.GroupBy:
          return FunctionType.First;
        default:
          return FunctionType.Select;
      }
    }

    if (ChartUtils.isNumberType(field.fieldType)) {
      switch (functionFormattingType) {
        case FunctionFormattingType.None:
          return FunctionType.Select;
        case FunctionFormattingType.GroupBy:
          return FunctionType.Sum;
      }
    }
    return FunctionType.Count;
  }

  static getDefaultColorFormatting(): ColorFormatting {
    return {
      enabled: true,
      formatType: ConditionalFormattingType.ColorScale,
      applyTo: ApplyToType.ValuesOnly,
      summarization: FunctionType.Count,
      baseOnField: TableField.default(),
      scale: {
        center: {
          enabled: false,
          type: ValueColorFormattingType.Default,
          color: '#e5ff85'
        },
        min: {
          enabled: true,
          color: '#d2f4ff',
          type: ValueColorFormattingType.Default
        },
        default: {
          specificColor: '#d2f4ff',
          formattingType: DefaultValueFormattingType.AsZero
        },
        max: {
          enabled: true,
          color: '#2d95ff',
          type: ValueColorFormattingType.Default
        }
      },
      rules: {
        colorRules: []
      }
    };
  }

  static getDefaultIconFormatting(canUseDefaultRules = false): IconFormatting {
    const rules = canUseDefaultRules ? FormattingOptions.IconOptions[0]?.data : [];
    return {
      enabled: true,
      formatType: ConditionalFormattingType.Rules,
      applyTo: ApplyToType.ValuesOnly,
      summarization: FunctionType.Count,
      layout: 'left',
      align: 'center',
      style: IconStyle.Default,
      baseOnField: TableField.default(),
      rules: {
        iconRules: rules ?? []
      }
    };
  }

  static buildId(field: Field) {
    return `${field.dbName}_${field.tblName}_${field.fieldName}`;
  }

  static buildTableOptions(tables: SlTreeNodeModel<TableSchema>[], filter: (column: SlTreeNodeModel<any>) => boolean): DropdownData[] {
    return tables
      .map(table => {
        return {
          type: DropdownType.Group,
          displayName: table.title,
          options:
            table.children
              ?.filter(column => filter(column))
              .map(column => {
                const field: Field = column.tag as Field;
                return {
                  displayName: column.title,
                  id: FormattingOptions.buildId(field),
                  field: field
                };
              }) ?? []
        };
      })
      .filter(table => ListUtils.isNotEmpty(table.options));
  }

  static isShowColumn(column: SlTreeNodeModel<any>, formatType: ConditionalFormattingType, isGroupBy: boolean): boolean {
    switch (formatType) {
      case ConditionalFormattingType.FieldValue: {
        const field: Field = column.tag as Field;
        return ChartUtils.isTextType(field.fieldType);
      }
      case ConditionalFormattingType.ColorScale: {
        if (isGroupBy) {
          return true;
        } else {
          const field: Field = column.tag as Field;
          return ChartUtils.isNumberType(field.fieldType);
        }
      }
      case ConditionalFormattingType.Rules: {
        return true;
      }
    }
  }

  private static createIconRule(greaterThanValue: number, lessThanValue: number, icon: string, isLessThanOrEqual = false): Rule {
    return {
      id: RandomUtils.nextString(),
      firstCondition: {
        conditionType: RuleType.GreaterThanOrEqual,
        value: greaterThanValue.toString(),
        valueType: ValueType.Percentage
      },
      value: icon,
      secondCondition: {
        conditionType: isLessThanOrEqual ? RuleType.LessThanOrEqual : RuleType.LessThan,
        value: lessThanValue.toString(),
        valueType: ValueType.Percentage
      }
    };
  }
}
