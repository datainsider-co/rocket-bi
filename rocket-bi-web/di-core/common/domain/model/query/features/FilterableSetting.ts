import { Condition, QuerySetting, TableColumn } from '@core/common/domain/model';
import { isFunction } from 'lodash';

/**
 * Sub class extends this abstract class will be a filter
 * Support get column for filter.
 */
export abstract class FilterableSetting {
  /**
   * Get column for build condition in setting.
   */
  abstract getFilterColumn(): TableColumn;

  /**
   * check filter is support or not. if not support, filter will be disable.
   */
  abstract isEnableFilter(): boolean;

  /**
   * check filter has default condition or not.
   */
  abstract hasDefaultCondition(): boolean;

  /**
   * get default condition for current filter.
   */
  abstract getDefaultCondition(): Condition | undefined;

  static isFilterable(query: QuerySetting | FilterableSetting | any): query is FilterableSetting {
    const setting = query as FilterableSetting;
    return (
      setting &&
      isFunction(setting.isEnableFilter) &&
      isFunction(setting.getFilterColumn) &&
      isFunction(setting.hasDefaultCondition) &&
      isFunction(setting.getDefaultCondition)
    );
  }
}

/**
 * Sub class extends this abstract class will be use in dashboard.
 * When user select value in chart and apply to other chart
 */
export abstract class CrossFilterable {
  abstract getFilterColumn(): TableColumn;

  abstract isEnableCrossFilter(): boolean;

  static isCrossFilterable(query: QuerySetting | CrossFilterable): query is CrossFilterable {
    const setting = query as CrossFilterable;
    return setting && isFunction(setting.isEnableCrossFilter) && isFunction(setting.getFilterColumn);
  }
}
