import { TableColumn } from '@core/domain';

export abstract class DynamicFunction {
  abstract enableDynamicFunction(): boolean;

  abstract getDefaultFunctions(): TableColumn[];

  static isFunctionControl(query: any): query is DynamicFunction {
    return !!query.enableDynamicFunction;
  }
}

export abstract class DynamicValues {
  abstract enableDynamicValues(): boolean;

  abstract getDefaultValues(): string[];

  static isValuesControl(query: any): query is DynamicValues {
    return !!query.getDefaultValues || !!query.enableDynamicValues;
  }
}
