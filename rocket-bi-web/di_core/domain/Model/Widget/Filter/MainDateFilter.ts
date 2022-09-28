import { FilterRequest } from '@core/domain';
import { Field, MainDateMode } from '@core/domain/Model';

/**
 * @deprecated will remove
 */
export class MainDateFilter {
  affectedField: Field;
  mode?: MainDateMode;
  filterRequest?: FilterRequest;

  constructor(affectedField: Field, mode?: MainDateMode, filterRequest?: FilterRequest) {
    this.affectedField = affectedField;
    this.mode = mode;
    this.filterRequest = filterRequest;
  }

  static fromObject(obj: MainDateFilter): MainDateFilter {
    const filterRequest = obj.filterRequest ? FilterRequest.fromObject(obj.filterRequest) : void 0;
    return new MainDateFilter(obj.affectedField, obj.mode, filterRequest);
  }
}
