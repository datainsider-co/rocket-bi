/*
 * @author: tvc12 - Thien Vi
 * @created: 12/16/20, 3:30 PM
 */

import { MainDateCompareResolver } from '@core/common/services/compare-builder/MainDateCompareResolver';
import { CompareRequest } from '@core/common/domain/request';

export abstract class CompareResolver {
  abstract build(): CompareRequest | undefined;
}

export class CompareResolvers {
  static mainDateCompareResolver(): MainDateCompareResolver {
    return new MainDateCompareResolver();
  }
}
