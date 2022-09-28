/*
 * @author: tvc12 - Thien Vi
 * @created: 3/29/21, 7:30 PM
 */

import { FieldRelatedFunction, GeoArea, TableColumn } from '@core/domain/Model';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';

export interface DrilldownData {
  value: string;
  toField: FieldRelatedFunction;
  name: string;
  geoArea?: GeoArea;
}

export abstract class Drilldownable {
  static isDrilldownable(obj: any): obj is Drilldownable {
    return !!(obj.buildQueryDrilldown && obj.getColumnWillDrilldown);
  }

  abstract getColumnWillDrilldown(): TableColumn;

  abstract buildQueryDrilldown(drilldownData: DrilldownData): QuerySetting;
}
