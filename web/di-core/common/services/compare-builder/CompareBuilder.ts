/*
 * @author: tvc12 - Thien Vi
 * @created: 12/15/20, 6:28 PM
 */

import { FieldRelatedCondition } from '@core/common/domain/model';
import { CompareRequest } from '@core/common/domain/request';

export abstract class CompareBuilder {
  abstract buildCompareRequest(firstCondition?: FieldRelatedCondition, secondCondition?: FieldRelatedCondition): CompareRequest;
}
