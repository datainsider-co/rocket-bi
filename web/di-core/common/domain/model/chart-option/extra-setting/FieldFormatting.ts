import { StyleSetting } from '@core/common/domain';
import { MetricNumberMode } from '@/utils';

export interface FieldFormatting {
  [key: string]: FieldFormatter;
}

export interface FieldFormatter {
  style?: StyleSetting;
  applyHeader?: boolean;
  applyTotals?: boolean;
  applyValues?: boolean;
  align?: AlignSetting;
  backgroundColor?: string;
  displayUnit?: MetricNumberMode;
  precision?: number;
}
