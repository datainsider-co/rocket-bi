import { Field, FilterMode, Id, WidgetId } from '@core/common/domain/model';
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
  controlId?: WidgetId;
}
