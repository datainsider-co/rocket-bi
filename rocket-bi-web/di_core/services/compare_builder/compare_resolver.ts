/*
 * @author: tvc12 - Thien Vi
 * @created: 12/16/20, 3:30 PM
 */

import { MainDateCompareResolver } from '@core/services/compare_builder/main_date_compare_resolver';
import { CompareRequest } from '@core/domain/Request';

export abstract class CompareResolver {
  abstract build(): CompareRequest | undefined;
}

export class CompareResolvers {
  static mainDateCompareResolver(): MainDateCompareResolver {
    return new MainDateCompareResolver();
  }
}
