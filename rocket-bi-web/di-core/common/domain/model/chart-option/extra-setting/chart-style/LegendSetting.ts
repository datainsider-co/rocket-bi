import { VerticalAlignValue } from 'highcharts';
import { StyleSetting, TextSetting } from '@core/common/domain';

export interface LegendSetting {
  enabled?: boolean;
  verticalAlign?: VerticalAlignValue;
  align?: AlignSetting;
  layout?: LayoutValue;
  title?: TextSetting;
  itemStyle?: StyleSetting;
  maxHeight?: number;
  x?: number;
  y?: number;
  floating?: boolean;
}

type LayoutValue = 'horizontal' | 'vertical';
