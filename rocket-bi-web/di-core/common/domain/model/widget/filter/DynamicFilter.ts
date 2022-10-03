/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:46 AM
 */

import { Condition, Field, FieldRelatedCondition, InlineSqlView, TabControlData, WidgetExtraData, WidgetId, Widgets } from '@core/common/domain/model';
import { RandomUtils } from '@/utils';
import { FilterRequest } from '@core/common/domain/request';
import { ConditionData, InputType } from '@/shared';
import { ConditionResolver } from '@core/common/services/condition-builder/ConditionResolver';
import { Di } from '@core/common/modules';
import { ConditionUtils, Log } from '@core/utils';
import { FilterWidget } from '@core/common/domain';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { TableField } from '@core/common/domain';

export enum FilterMode {
  range = 'range',
  selection = 'selection'
}

export class DynamicFilter implements FilterWidget {
  className = Widgets.DynamicFilter;
  id: WidgetId;
  name = '';
  currentValues: string[];
  currentOptionSelected: string;
  isEnable: boolean;
  isNested: boolean;
  filterModeSelected: FilterMode;
  field: Field;
  currentInputType: InputType;

  description = '';
  backgroundColor?: string | undefined;
  extraData?: WidgetExtraData | undefined;
  textColor?: string | undefined;
  isHidden?: boolean;
  sqlView?: InlineSqlView;
  control?: TabControlData;

  constructor(
    id: WidgetId,
    field: Field,
    name: string,
    currentValues: string[],
    currentOptionSelected: string,
    isEnable: boolean,
    isNested: boolean,
    filterModeSelected: FilterMode,
    currentInputType: InputType,
    isHidden?: boolean,
    sqlView?: InlineSqlView,
    control?: TabControlData
  ) {
    this.id = id;
    this.name = name;
    this.currentValues = currentValues;
    this.currentOptionSelected = currentOptionSelected;
    this.isEnable = isEnable;
    this.isNested = isNested;
    this.field = field;
    this.filterModeSelected = filterModeSelected;
    this.currentInputType = currentInputType;
    this.isHidden = isHidden;
    this.sqlView = sqlView;
    this.control = control;
  }

  static from(field: Field, name: string, isNested: boolean, id?: number, sqlView?: InlineSqlView): DynamicFilter {
    id = id ?? RandomUtils.nextInt(0, 5000);
    return new DynamicFilter(id, field, name, [], '', true, isNested, FilterMode.range, InputType.text, false, sqlView);
  }

  static fromObject(obj: DynamicFilter): DynamicFilter {
    const id: WidgetId = obj.id ?? RandomUtils.nextInt(5000);
    const field: Field = Field.fromObject(obj.field);
    const name: string = obj.name ?? '';
    const currentValues: string[] = obj.currentValues ?? [];
    const currentOptionSelect: string = obj.currentOptionSelected ?? '';
    const isEnable: boolean = obj.isEnable ?? true;
    const isNested: boolean = obj.isNested ?? false;
    const selected = obj.filterModeSelected ?? FilterMode.range;
    const inputType = obj.currentInputType ?? InputType.text;
    const sqlView = obj.sqlView ? InlineSqlView.fromObject(obj.sqlView) : void 0;
    const control = obj.control ?? void 0;
    return new DynamicFilter(id, field, name, currentValues, currentOptionSelect, isEnable, isNested, selected, inputType, obj.isHidden, sqlView, control);
  }

  static empty() {
    return new DynamicFilter(-1, TableField.default(), '', [], '', true, false, FilterMode.range, InputType.text);
  }

  toCondition(chartId: WidgetId): Condition | undefined {
    return undefined;
  }

  toFilterRequest(): FilterRequest | undefined {
    if (this.isEnable) {
      const conditionData: ConditionData | undefined = this.toConditionData();
      const conditionBuilder: ConditionResolver = Di.get(ConditionResolver);
      if (conditionBuilder && conditionData) {
        const condition: Condition | undefined = conditionBuilder.buildCondition(-1, conditionData);
        if (condition) {
          return new FilterRequest(-1, condition, true, true);
        }
      }
    }
    return void 0;
  }

  getProfileField(): FieldDetailInfo {
    return new FieldDetailInfo(this.field, this.name, this.name, this.isNested, this.isHidden, this.sqlView);
  }

  private toConditionData(): ConditionData | undefined {
    const familyType = ConditionUtils.getFamilyTypeFromFieldType(this.field.fieldType);
    const [firstValue, secondValue] = this.currentValues;
    if (familyType) {
      return {
        field: this.field,
        familyType: familyType,
        subType: this.currentOptionSelected,
        isNested: this.isNested,
        id: -1,
        groupId: -1,
        firstValue: firstValue,
        secondValue: secondValue,
        allValues: this.currentValues,
        currentInputType: this.currentInputType,
        currentOptionSelected: this.currentOptionSelected,
        filterModeSelected: this.filterModeSelected
      };
    } else {
      Log.info(`toConditionData:: for ${this.field.fieldType} unsupported`);
      return void 0;
    }
  }

  setTitle(title: string) {
    this.name = title;
  }
}
