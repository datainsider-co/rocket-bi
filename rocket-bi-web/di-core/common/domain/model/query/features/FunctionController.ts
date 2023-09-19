import { TableColumn } from '@core/common/domain';
import { isFunction } from 'lodash';

export abstract class FunctionController {
  abstract isEnableFunctionControl(): boolean;

  abstract getDefaultTableColumns(): TableColumn[];

  static isFunctionController(query: any | FunctionController): query is FunctionController {
    return query && isFunction(query.isEnableFunctionControl) && isFunction(query.getDefaultTableColumns);
  }
}
