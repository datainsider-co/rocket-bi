/*
 * @author: tvc12 - Thien Vi
 * @created: 5/27/21, 11:33 AM
 */

import { VisualizationResponse, VizResponseType } from '@core/common/domain/response';
import { ListUtils } from '@/utils';

/**
 * @deprecated from v1.0.0
 */
export class SeriesDrillDownItem {
  constructor(public name: string, public y: number, public drilldown: string) {}

  static fromObject(object: SeriesDrillDownItem): SeriesDrillDownItem {
    return new SeriesDrillDownItem(object.name, object.y, object.drilldown);
  }
}

/**
 * @deprecated from v1.0.0
 */
export class DrilldownItem {
  constructor(public name: string, public id: number, public data: SeriesDrillDownItem[]) {}

  static fromObject(object: DrilldownItem): DrilldownItem {
    const data = object?.data.map(item => SeriesDrillDownItem.fromObject(item)) || [];
    return new DrilldownItem(object.name, object.id, data);
  }
}

/**
 * @deprecated from v1.0.0
 */
export class DrilldownResponse implements VisualizationResponse {
  className: VizResponseType = VizResponseType.DrilldownResponse;

  constructor(public series: SeriesDrillDownItem[], public drilldown: DrilldownItem[]) {}

  static empty(): DrilldownResponse {
    return new DrilldownResponse([], []);
  }

  static fromObject(obj: DrilldownResponse): DrilldownResponse {
    const series = obj.series?.map(item => SeriesDrillDownItem.fromObject(item)) || [];
    const drilldown = obj.drilldown?.map(item => DrilldownItem.fromObject(item)) || [];

    return new DrilldownResponse(series, drilldown);
  }

  hasData(): boolean {
    return ListUtils.isNotEmpty(this.series);
  }
}
