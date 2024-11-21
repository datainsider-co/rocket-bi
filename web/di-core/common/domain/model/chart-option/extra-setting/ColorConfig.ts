/*
 * @author: tvc12 - Thien Vi
 * @created: 6/17/21, 10:36 AM
 */

import { Disabled, StyleSetting } from '@core/common/domain';

export interface ColorConfig {
  minColor: string;
  maxColor: string;
  noneColor: string;
  enableDisplayValue: boolean;
  textStyle: StyleSetting | Disabled;
}
