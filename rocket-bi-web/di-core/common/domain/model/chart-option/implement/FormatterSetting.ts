/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 2:45 PM
 */

import { TableColumn } from '@core/common/domain';

export abstract class FormatterSetting {
  abstract getFormatters(): TableColumn[];

  static isFormatterSetting(obj: any): obj is FormatterSetting {
    return !!obj?.getFormatters;
  }
}
