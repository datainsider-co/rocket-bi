/*
 * @author: tvc12 - Thien Vi
 * @created: 8/3/21, 4:13 PM
 */

import { ColorFormatting } from '@core/common/domain/model/chart-option/extra-setting/condition-formatting/ColorFormatting';
import { DataBarFormatting, IconFormatting } from '@core/common/domain';

export interface ConditionalFormattingData {
  label?: string;
  backgroundColor?: ColorFormatting;
  color?: ColorFormatting;
  dataBar?: DataBarFormatting;
  icon?: IconFormatting;
}
