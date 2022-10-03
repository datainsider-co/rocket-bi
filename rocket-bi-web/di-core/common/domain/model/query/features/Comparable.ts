/*
 * @author: tvc12 - Thien Vi
 * @created: 8/6/21, 2:01 PM
 */

import { isFunction } from 'lodash';
import { CompareRequest, FilterRequest } from '@core/common/domain';

export abstract class Comparable {
  static isComparable(obj: any): obj is Comparable {
    return !!obj && isFunction(obj.getCompareRequest) && isFunction(obj.getDateFilterRequests);
  }

  abstract getCompareRequest(): CompareRequest | undefined;

  abstract getDateFilterRequests(): FilterRequest[];
}
