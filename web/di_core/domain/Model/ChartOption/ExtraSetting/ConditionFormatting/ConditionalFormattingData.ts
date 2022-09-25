/*
 * @author: tvc12 - Thien Vi
 * @created: 8/3/21, 4:13 PM
 */

import { ColorFormatting } from '@core/domain/Model/ChartOption/ExtraSetting/ConditionFormatting/ColorFormatting';
import { DataBarFormatting, IconFormatting } from '@core/domain';

export interface ConditionalFormattingData {
  label?: string;
  backgroundColor?: ColorFormatting;
  color?: ColorFormatting;
  dataBar?: DataBarFormatting;
  icon?: IconFormatting;
}
