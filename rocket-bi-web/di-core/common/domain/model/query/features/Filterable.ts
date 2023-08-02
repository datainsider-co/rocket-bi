import { Condition, QuerySetting, TableColumn } from '@core/common/domain/model';
import { isFunction } from 'lodash';

export abstract class Filterable {
  abstract getFilter(): TableColumn;

  abstract isEnableFilter(): boolean;

  abstract hasDefaultValue(): boolean;

  abstract getDefaultCondition(): Condition | undefined;

  static isFilterable(query: QuerySetting | Filterable): query is Filterable {
    return query && isFunction((query as Filterable).isEnableFilter);
  }
}

export abstract class CrossFilterable {
  abstract getFilter(): TableColumn;

  abstract isEnableCrossFilter(): boolean;

  static isCrossFilterable(query: QuerySetting | CrossFilterable): query is CrossFilterable {
    return query && isFunction((query as CrossFilterable).isEnableCrossFilter);
  }
}
