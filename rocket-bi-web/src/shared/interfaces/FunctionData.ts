import { Field, Id, TabControlData } from '@core/common/domain/model';

export interface FunctionData {
  id: Id;
  name: string;
  functionFamily: string;
  functionType?: string;
  field: Field;
  tableName?: string;
  columnName?: string;
  displayAsColumn?: boolean;
  isNested: boolean;
  sorting: string;
  numElemsShown?: number | null;
  isShowNElements?: boolean;
  dynamicFunction?: TabControlData;
}
