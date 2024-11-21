import { Field, Id, ChartControlData } from '@core/common/domain/model';

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
  dynamicFunction?: ChartControlData;
}
