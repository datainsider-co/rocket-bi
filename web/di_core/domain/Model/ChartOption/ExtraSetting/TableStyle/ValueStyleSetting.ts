/*
 * @author: tvc12 - Thien Vi
 * @created: 6/17/21, 2:37 PM
 */

import { StyleSetting } from '@core/domain';

export interface ValueStyleSetting {
  color?: string;
  backgroundColor?: string;
  alternateColor: string;
  alternateBackgroundColor?: string;
  style?: StyleSetting;
  align?: AlignSetting;
  enableUrlIcon?: boolean;
}
