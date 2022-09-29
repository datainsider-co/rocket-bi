import { MinMaxCondition, StyleSetting, TextSetting } from '@core/common/domain';
import { DashStyleValue } from 'highcharts';

export interface AxisSetting {
  visible: boolean;
  opposite?: boolean;
  title?: TextSetting;
  labels?: LabelsSetting;
  gridLineColor?: string;
  gridLineDashStyle?: DashStyleValue;
  gridLineInterpolation?: string;
  gridLineWidth?: number | string;
  plotBands?: any[];
  min?: number;
  max?: number;
  stops?: any[][];
  condition?: MinMaxCondition;
  prefix?: TextSetting;
  postfix?: TextSetting;
}

export interface LabelsSetting {
  style?: StyleSetting;
}
