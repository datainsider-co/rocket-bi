import { DynamicFilter, Field, FilterMode, Id, TabControl, TabControlData } from '@core/domain/Model';
import { InputType } from '@/shared';

export interface ConditionData {
  id: Id;
  groupId: number;
  field: Field;
  tableName?: string;
  columnName?: string;
  isNested: boolean;
  familyType: string;
  subType?: string;
  firstValue?: string;
  secondValue?: string;
  allValues: string[];
  currentInputType: InputType;
  filterModeSelected: FilterMode;
  currentOptionSelected: string;
  tabControl?: TabControlData;
}
