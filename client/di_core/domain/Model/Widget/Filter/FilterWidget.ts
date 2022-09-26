/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:53 AM
 */

import { WidgetCommonData } from '@core/domain/Model';
import { Widget } from '@core/domain/Model/Widget/Widget';
import { FilterRequest } from '@core/domain/Request';

/**
 * @deprecated from v1.0.0
 */
export abstract class FilterWidget extends Widget {
  protected constructor(commonSetting: WidgetCommonData) {
    super(commonSetting);
  }

  abstract toFilterRequest(): FilterRequest | undefined;
}
