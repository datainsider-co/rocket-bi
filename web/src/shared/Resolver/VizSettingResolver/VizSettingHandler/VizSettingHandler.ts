/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:55 AM
 */

import { ChartType } from '@/shared';
import { ChartOption, ChartOptionData } from '@core/domain/Model';

export abstract class VizSettingHandler {
  abstract toVizSetting(type: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined;
}
