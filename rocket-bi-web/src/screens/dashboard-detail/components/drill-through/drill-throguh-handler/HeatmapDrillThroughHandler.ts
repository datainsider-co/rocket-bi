/*
 * @author: tvc12 - Thien Vi
 * @created: 7/20/21, 10:41 PM
 */

import { DrillThroughHandler } from '@/screens/dashboard-detail/components/drill-through/drill-throguh-handler/DrillThroughHandler';
import { ChartInfo, InternalFilter, HeatMapQuerySetting } from '@core/common/domain';
import { ListUtils, SchemaUtils } from '@/utils';

export class HeatmapDrillThroughHandler extends DrillThroughHandler {
  constructor() {
    super();
  }

  createFilter(metaData: ChartInfo, value: string): InternalFilter[] {
    const { setting } = metaData;
    if (HeatMapQuerySetting.isHeatMapQuerySetting(setting)) {
      const column = setting.xAxis;
      const field = column.function.field;
      const filter = InternalFilter.from(field, column.name, SchemaUtils.isNested(field.fieldName));
      filter.sqlView = ListUtils.getHead(setting.sqlViews);
      this.configFilterValue(filter, value);
      return [filter];
    } else {
      return [];
    }
  }
}
