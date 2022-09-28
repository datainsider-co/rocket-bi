/*
 * @author: tvc12 - Thien Vi
 * @created: 7/6/21, 7:38 PM
 */

import { DefaultValueFormattingType } from '@core/domain';

export interface DefaultValueColorFormatting {
  formattingType?: DefaultValueFormattingType;
  specificColor?: string;
}
