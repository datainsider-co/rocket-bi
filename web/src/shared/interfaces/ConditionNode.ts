import { SlTreeNode } from '@/shared/components/builder/treemenu/SlVueTree';
import { ChartControlField, Field, FilterMode, TableSchema, WidgetId } from '@core/common/domain/model';
import { DateHistogramConditionTypes, InputType, NumberConditionTypes, StringConditionTypes } from '@/shared';

export interface ConditionNode {
  label: string;
  conditions?: ValueCondition[] | OptionCondition[];
}

export interface ValueCondition {
  label: string;
  value?: string[];
}

export interface OptionCondition {
  type: string;
  label: string;
  options?: MultiValuesCondition[];
}

export interface MultiValuesCondition {
  label: string;
  values?: string[];
}

export interface ConditionTreeNode extends SlTreeNode<ConditionNode | ValueCondition | OptionCondition | MultiValuesCondition> {
  id: number;
  groupId: number;

  filterFamily: string;
  filterType: string;
  filterCondition: string;
  firstValue: string;
  secondValue: string;
  parent: SlTreeNode<TableSchema>;
  field?: Field;

  allValues: string[];

  currentInputType: InputType;
  filterModeSelected: FilterMode;
  currentOptionSelected: StringConditionTypes | DateHistogramConditionTypes | NumberConditionTypes;
  controlId?: WidgetId;
}
