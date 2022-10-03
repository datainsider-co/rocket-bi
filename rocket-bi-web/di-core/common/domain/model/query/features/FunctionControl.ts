import { TableColumn } from '@core/common/domain';

export abstract class FunctionControl {
  abstract enableFunctionControl(): boolean;

  abstract getDefaultFunctions(): TableColumn[];

  static isFunctionControl(query: any): query is FunctionControl {
    return !!query.enableFunctionControl;
  }
}

export abstract class DynamicValues {
  abstract enableDynamicValues(): boolean;

  abstract getDefaultValues(): string[];

  static isValuesControl(query: any): query is DynamicValues {
    return !!query.getDefaultValues || !!query.enableDynamicValues;
  }
}
