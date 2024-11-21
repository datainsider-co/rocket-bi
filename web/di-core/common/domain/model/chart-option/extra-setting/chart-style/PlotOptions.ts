import { DashStyleValue } from 'highcharts';
import { StyleSetting } from '@core/common/domain';
import { MetricNumberMode } from '@/utils';
import { Align } from '@/shared';
import { DataLabelFormatterMode } from '@chart/PieChart';

export interface PlotOptions {
  // line?: PlotLine;
  // area?: PlotArea;
  series?: PlotSeries;
  area?: PlotSeries;
  gauge?: PlotGauge;
  solidgauge?: PlotSeries;
  treemap?: PlotTreeMap;
  column?: PlotSeries;
  pie?: PlotSeries;
  pyramid?: PlotSeries;
  funnel?: PlotSeries;
  item?: PlotSeries;
  heatmap?: PlotSeries;
  map?: PlotSeries;
  sankey?: PlotSankey;
  table?: PlotTable;
  displayType?: string;
}

export interface PlotKPI {
  dataLabels?: DataLabels;
}

export interface PlotTable {
  dataLabels?: DataLabels;
}

export interface PlotGauge {
  dial?: Dial;
}

export interface PlotSeries {
  lineWidth?: number;
  dashStyle?: DashStyleValue;
  marker?: Marker;
  dataLabels?: DataLabels;
  stacking?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string;
  color?: string;
  groupPadding?: number;
  pointPadding?: number;
  compare?: string;
  innerSize?: string;
  //not highchart setting
  response?: ResponseSetting;
  targetOptions?: TargetOptions;
  startAngle?: number;
  endAngle?: number;
  center?: string[];
  size?: string;
}

export interface TargetOptions {
  height?: number;
  color?: string;
  value?: number;
}

export interface PlotSankey {
  dataLabels?: DataLabels;
  borderWidth?: number;
  borderColor?: string;
  color?: string;
  groupPadding?: number;
  pointPadding?: number;
  //not highchart setting
  response?: ResponseSetting;
}

interface SeriesItemSetting {
  lineWidth?: number;
  dashStyle?: DashStyleValue;
  marker?: Marker;
  type?: string;
  yAxis?: number;
}

export interface ResponseSetting {
  [key: string]: SeriesItemSetting;
}

export interface Marker {
  enabled?: boolean;
  lineWidth?: number;
}

export interface DataLabels {
  enabled?: boolean;
  style?: StyleSetting;
  displayUnit?: MetricNumberMode;
  labelFormat?: DataLabelFormatterMode;
  borderWidth?: number;
  textOutline?: string;
  useHTML?: boolean;
  condition?: MinMaxCondition;
  distance?: number;
}

export interface MinMaxCondition {
  enabled: boolean;
  min?: EqualValue;
  max?: EqualValue;
}

export interface EqualValue {
  enabled?: boolean;
  equal?: boolean;
  value?: number;
}

export interface Dial {
  backgroundColor?: string;
}

export interface PlotTreeMap {
  traverseUpButton?: ButtonSetting;
  dataLabels?: DataLabels;
  levels?: LevelSetting[];
  layoutAlgorithm?: string;
}

export interface ButtonSetting {
  position?: PositionSetting;
  theme?: ChartThemeSetting;
  dataLabels?: DataLabels;
  levelIsConstant?: boolean;
}

export interface PositionSetting {
  align?: Align;
}

export interface ChartThemeSetting {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  r?: number;
  states?: StatesSetting;
  levels?: [];
}

export interface StatesSetting {
  hover?: ChartThemeSetting;
  selected?: ChartThemeSetting;
}

export interface LevelSetting {
  level?: number;
  dataLabels?: DataLabels;
  borderWidth?: number;
}
