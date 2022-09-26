import { Condition, TableColumn } from '@core/domain';

export interface DefaultFilterValue {
  value?: any;
  conditions?: Condition;
}

export interface DefaultDynamicFunctionValue {
  values?: any[];
  columns?: TableColumn[];
}
