/*
 * @author: tvc12 - Thien Vi
 * @created: 12/16/20, 3:28 PM
 */

import { FieldRelatedCondition } from '@core/common/domain/model';
import { CompareRequest } from '@core/common/domain/request';
import { CompareMode } from '@core/common/domain/request/query/CompareMode';
import { CompareBuilder } from '@core/common/services';

export class NumberCompareBuilder implements CompareBuilder {
  buildCompareRequest(firstCondition?: FieldRelatedCondition, secondCondition?: FieldRelatedCondition): CompareRequest {
    return new CompareRequest(firstCondition, secondCondition, CompareMode.PercentageDifference);
  }
}
