/*
 * @author: tvc12 - Thien Vi
 * @created: 7/20/21, 10:35 PM
 */

import { MouseEventData } from '@chart/BaseChart';
import { ChartInfo, DynamicFilter, QuerySettingType } from '@core/common/domain';
import { DrillThroughHandler } from '@/screens/dashboard-detail/components/drill-through/drill-throguh-handler/DrillThroughHandler';
import { DefaultDrillThroughHandler } from '@/screens/dashboard-detail/components/drill-through/drill-throguh-handler/DefaultDrillThroughHandler';
import { Log } from '@core/utils';
import { BubbleDrillThroughHandler } from '@/screens/dashboard-detail/components/drill-through/drill-throguh-handler/BubbleDrillThroughHandler';
import { HeatmapDrillThroughHandler } from '@/screens/dashboard-detail/components/drill-through/drill-throguh-handler/HeatmapDrillThroughHandler';
import { HistogramDrillThroughHandler } from '@/screens/dashboard-detail/components/drill-through/drill-throguh-handler/HistogramDrillThroughHandler';

export class DrillThroughResolver {
  private readonly handlerAsMap: Map<QuerySettingType, DrillThroughHandler>;
  private readonly defaultHandler: DrillThroughHandler;

  constructor() {
    this.handlerAsMap = new Map<QuerySettingType, DrillThroughHandler>([
      [QuerySettingType.Bubble, new BubbleDrillThroughHandler()],
      [QuerySettingType.HeatMap, new HeatmapDrillThroughHandler()],
      [QuerySettingType.Histogram, new HistogramDrillThroughHandler()]
    ]);
    this.defaultHandler = new DefaultDrillThroughHandler();
  }

  createFilter(metaData: ChartInfo, value: string): DynamicFilter[] {
    try {
      const handler = this.handlerAsMap.get(metaData.setting.className) ?? this.defaultHandler;
      return handler.createFilter(metaData, value);
    } catch (ex) {
      Log.error('createFilter::ex', ex);
      return [];
    }
  }
}
