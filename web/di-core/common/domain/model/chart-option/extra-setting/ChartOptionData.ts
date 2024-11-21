/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:41 PM
 */

import { QueryParameter, TextSetting, ThemeColor, WidgetId } from '@core/common/domain/model';
import { MetricNumberMode } from '@/utils';

export interface ChartOptionData {
  title?: TextSetting;
  textColor?: string;
  background?: string;
  subtitle?: TextSetting;
  html?: string;
  js?: string;
  css?: string;
  /**
   * @deprecated unused this properties
   */
  isCustomDisplay?: boolean;
  isEnableDrilldown?: boolean;
  isEnableZoom?: boolean;
  affectedByFilter?: boolean;
  enableIconZoom?: boolean;
  enableIconDrilldown?: boolean;
  themeColor?: ThemeColor;

  metricNumbers?: MetricNumberMode;
  numDataPoint?: number;
  precision?: number;
  thousandSep?: string;
  decimalPoint?: string;

  isCrossFilter?: boolean;
  queryParameter?: Record<string, QueryParameter>;
  parameterConfig?: QueryParameter;

  parameterWidgetIds?: WidgetId[];

  [key: string]: any;
}
