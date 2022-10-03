/*
 * @author: tvc12 - Thien Vi
 * @created: 7/21/21, 10:03 PM
 */

import { ValueColorFormatting } from '@core/common/domain';

export type DataBarDirection = 'left' | 'right';

export interface DataBarFormatting {
  enabled?: boolean;
  min?: ValueColorFormatting;
  max?: ValueColorFormatting;
  direction?: DataBarDirection;
  axisColor?: string;
  positiveColor?: string;
  negativeColor?: string;
}
