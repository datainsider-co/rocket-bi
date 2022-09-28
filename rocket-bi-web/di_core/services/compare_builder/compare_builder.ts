/*
 * @author: tvc12 - Thien Vi
 * @created: 12/15/20, 6:28 PM
 */

import { FieldRelatedCondition } from '@core/domain/Model';
import { CompareRequest } from '@core/domain/Request';

export abstract class CompareBuilder {
  abstract buildCompareRequest(firstCondition?: FieldRelatedCondition, secondCondition?: FieldRelatedCondition): CompareRequest;
}
