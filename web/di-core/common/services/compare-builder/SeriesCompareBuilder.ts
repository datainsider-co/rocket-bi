import { CompareBuilder } from '@core/common/services';
import { FieldRelatedCondition } from '@core/common/domain/model';
import { CompareRequest } from '@core/common/domain/request';
import { CompareMode } from '@core/common/domain/request/query/CompareMode';

export class SeriesCompareBuilder implements CompareBuilder {
  buildCompareRequest(firstCondition?: FieldRelatedCondition, secondCondition?: FieldRelatedCondition): CompareRequest {
    return new CompareRequest(firstCondition, secondCondition, CompareMode.RawValues);
  }
}
