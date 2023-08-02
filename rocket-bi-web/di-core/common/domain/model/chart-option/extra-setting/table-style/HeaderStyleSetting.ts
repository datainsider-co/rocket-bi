/*
 * @author: tvc12 - Thien Vi
 * @created: 6/17/21, 10:40 AM
 */

import { BorderStyleSetting, StyleSetting } from '@core/common/domain';

export interface HeaderStyleSetting {
  backgroundColor?: string;
  color?: string;
  style?: StyleSetting;

  isAutoWidthSize?: boolean;
  isWordWrap?: boolean;
  align?: AlignSetting;
}
