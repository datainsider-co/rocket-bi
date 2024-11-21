import { Condition, TableColumn } from '@core/common/domain';

export interface DefaultFilterValue {
  value?: any;
  conditions?: Condition;
}

export interface DefaultDynamicFunctionValue {
  values?: any[];
  columns?: TableColumn[];
}
