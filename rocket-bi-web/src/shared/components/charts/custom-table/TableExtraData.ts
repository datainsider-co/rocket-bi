/*
 * @author: tvc12 - Thien Vi
 * @created: 6/18/21, 4:41 PM
 */

import { ChartOptionData, FieldFormatting, GridSetting, PlotOptions, TotalSetting } from '@core/common/domain';
import { MetricNumberMode } from '@/utils';

export interface TableExtraData {
  total?: TotalSetting;
  grid?: GridSetting;
  plotOptions?: PlotOptions;
  precision?: number;
  fieldFormatting?: FieldFormatting;
}
