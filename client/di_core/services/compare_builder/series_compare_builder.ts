import { CompareBuilder } from '@core/services';
import { FieldRelatedCondition } from '@core/domain/Model';
import { CompareRequest } from '@core/domain/Request';
import { CompareMode } from '@core/domain/Request/Query/CompareMode';

export class SeriesCompareBuilder implements CompareBuilder {
  buildCompareRequest(firstCondition?: FieldRelatedCondition, secondCondition?: FieldRelatedCondition): CompareRequest {
    return new CompareRequest(firstCondition, secondCondition, CompareMode.RawValues);
  }
}
