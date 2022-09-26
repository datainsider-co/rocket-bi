/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:32 AM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/1/20, 7:38 PM
 */

import { ChartType } from '@/shared';
import { VizSettingHandler } from './VizSettingHandler/VizSettingHandler';
import { ChartOption, ChartOptionData } from '@core/domain/Model';
import { Log } from '@core/utils';

export class VizSettingResolver {
  constructor(private handlers: Map<string, VizSettingHandler>) {}

  toVizSetting(chartType: ChartType, diSettingOptions: ChartOptionData): ChartOption | undefined {
    const handler: VizSettingHandler | undefined = this.handlers.get(chartType);
    if (handler) {
      return handler.toVizSetting(chartType, diSettingOptions);
    } else {
      Log.debug("Can't build visualization setting");
      return void 0;
    }
  }
}
