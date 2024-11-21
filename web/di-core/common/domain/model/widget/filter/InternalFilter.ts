/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:46 AM
 */

import { Condition, Field, InlineSqlView, Position, WidgetExtraData, WidgetId, Widgets } from '@core/common/domain/model';
import { RandomUtils } from '@/utils';
import { FilterRequest } from '@core/common/domain/request';
import { ConditionData, DateHistogramConditionTypes, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';
import { ConditionResolver } from '@core/common/services/condition-builder/ConditionResolver';
import { Di } from '@core/common/modules';
import { ConditionUtils, Log } from '@core/utils';
import { FilterWidget, TableField } from '@core/common/domain';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';

export enum FilterMode {
  Range = 'range',
  Selection = 'selection'
}

export class InternalFilter implements FilterWidget {
  className = Widgets.DynamicFilter;
  id: WidgetId;
  name = '';
  currentValues: string[];
  currentOptionSelected: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes;
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
  controlId: WidgetId | null;

  constructor(
    id: WidgetId,
    field: Field,
    name: string,
    currentValues: string[],
    currentOptionSelected: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes,
    isEnable: boolean,
    isNested: boolean,
    filterModeSelected: FilterMode,
    currentInputType: InputType,
    isHidden?: boolean,
    sqlView?: InlineSqlView,
    controlId: WidgetId | null = null
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
    this.controlId = controlId;
  }

  static from(field: Field, name: string, isNested: boolean, id?: number, sqlView?: InlineSqlView, controlId?: WidgetId): InternalFilter {
    id = id ?? RandomUtils.nextInt(0, 50000);
    return new InternalFilter(id, field, name, [], StringConditionTypes.in, true, isNested, FilterMode.Range, InputType.Text, false, sqlView, controlId);
  }

  static fromObject(obj: InternalFilter): InternalFilter {
    const id: WidgetId = -RandomUtils.nextInt(50000, 500000);
    const field: Field = Field.fromObject(obj.field);
    const name: string = obj.name ?? '';
    const currentValues: string[] = obj.currentValues ?? [];
    const currentSelectedCondition = obj.currentOptionSelected ?? StringConditionTypes.in;
    const isEnable: boolean = obj.isEnable ?? true;
    const isNested: boolean = obj.isNested ?? false;
    const selected = obj.filterModeSelected ?? FilterMode.Range;
    const inputType = obj.currentInputType ?? InputType.Text;
    const sqlView = obj.sqlView ? InlineSqlView.fromObject(obj.sqlView) : void 0;
    return new InternalFilter(
      id,
      field,
      name,
      currentValues,
      currentSelectedCondition,
      isEnable,
      isNested,
      selected,
      inputType,
      obj.isHidden,
      sqlView,
      obj.controlId ?? null
    );
  }

  static empty() {
    const id: WidgetId = -RandomUtils.nextInt(50000, 500000);
    return new InternalFilter(id, TableField.default(), '', [], StringConditionTypes.in, true, false, FilterMode.Range, InputType.Text);
  }

  toFilterRequest(): FilterRequest | undefined {
    if (this.isEnable) {
      const conditionData: ConditionData | undefined = this.toConditionData();
      const conditionBuilder: ConditionResolver = Di.get(ConditionResolver);
      if (conditionBuilder && conditionData) {
        const condition: Condition | undefined = conditionBuilder.buildCondition(-1, conditionData);
        if (condition) {
          return new FilterRequest(this.id, condition, true, true);
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

  getBackgroundColorOpacity(): number {
    return 100;
  }

  getBackgroundColor(): string | undefined {
    return this.backgroundColor;
  }

  getDefaultPosition(): Position {
    return new Position(-1, -1, 8, 3, 1);
  }

  getOverridePadding(): string | undefined {
    return void 0;
  }

  setDescription(description: string): void {
    this.description = description;
  }
}
