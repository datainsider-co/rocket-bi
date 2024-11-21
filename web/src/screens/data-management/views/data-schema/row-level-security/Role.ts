import { Field, FieldType, FilterMode, TableField, WidgetExtraData } from '@core/common/domain';
import { InputType } from '@/shared';

export class Role {
  id: number;
  name: string;
  description: string;
  attributeKey: string;
  attributeValue: string;
  extraData: WidgetExtraData;

  constructor(id: number, name: string, description: string, attributeKey: string, attributeValue: string, extraData: WidgetExtraData) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.attributeKey = attributeKey;
    this.attributeValue = attributeValue;
    this.extraData = extraData;
  }

  static empty(): Role {
    return new Role(-1, '', '', '', '', Role.extraSample());
  }

  static mock(): Role[] {
    return [
      new Role(1, 'It', '', '', '', Role.extraSample2()),
      new Role(2, 'Management', '', '', '', Role.extraSample()),
      new Role(3, 'Sales', '', '', '', Role.extraSample()),
      new Role(4, 'Director', '', '', '', Role.extraSample())
    ];
  }

  static extraSample(): WidgetExtraData {
    const field3 = TableField.fromObject({
      dbName: 'cooky_csv',
      tblName: 'sale',
      fieldName: 'Sales_Channel',
      fieldType: 'string'
    });
    return {
      // @ts-ignore
      configs: {
        //
      },
      filters: {
        896121: [
          {
            id: 302185,
            groupId: 896121,
            familyType: 'String',
            subType: 'in',
            firstValue: 'Offline',
            field: field3,
            tableName: 'sale',
            columnName: 'Sales Channel',
            isNested: false,
            allValues: ['Offline'],
            filterModeSelected: FilterMode.Range,
            currentOptionSelected: 'in',
            currentInputType: InputType.Text
          }
        ]
      },
      currentChartType: 'line'
    };
  }

  static extraSample2(): WidgetExtraData {
    return {
      // @ts-ignore
      configs: {
        //
      },
      filters: {
        //
      },
      currentChartType: 'line'
    };
  }
}
