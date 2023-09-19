/* eslint-disable @typescript-eslint/no-use-before-define */
import { FilterRequest } from '@core/common/domain';
import { Field, MainDateMode } from '@core/common/domain/model';

/**
 * @deprecated use MainDateFilter2 instead of this
 */
export class MainDateFilter {
  affectedField: Field;
  mode?: MainDateMode;
  /**
   * Filter to apply boost mode
   */
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
