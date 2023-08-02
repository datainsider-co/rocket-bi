import { QuerySetting } from '@core/common/domain';

export abstract class TransformQuery {
  abstract transform(): QuerySetting;

  static isTransformQuery(query: QuerySetting | TransformQuery): query is TransformQuery {
    return !!(query as TransformQuery)?.transform;
  }
}
