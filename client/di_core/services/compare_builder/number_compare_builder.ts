/*
 * @author: tvc12 - Thien Vi
 * @created: 12/16/20, 3:28 PM
 */

import { FieldRelatedCondition } from '@core/domain/Model';
import { CompareRequest } from '@core/domain/Request';
import { CompareMode } from '@core/domain/Request/Query/CompareMode';
import { CompareBuilder } from '@core/services';

export class NumberCompareBuilder implements CompareBuilder {
  buildCompareRequest(firstCondition?: FieldRelatedCondition, secondCondition?: FieldRelatedCondition): CompareRequest {
    return new CompareRequest(firstCondition, secondCondition, CompareMode.PercentageDifference);
  }
}
