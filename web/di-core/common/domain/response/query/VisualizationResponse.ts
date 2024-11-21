/*
 * @author: tvc12 - Thien Vi
 * @created: 5/27/21, 11:32 AM
 */

import { SeriesOneResponse } from './SeriesOneRespone';
import { SeriesTwoResponse } from './SeriesTwoResponse';
import { DrilldownResponse } from './DrilldownResponse';
import { TableResponse } from './TableResponse';
import { ClassNotFound } from '@core/common/domain/exception/ClassNotFound';
import { GroupTableResponse } from '@core/common/domain/response/query/GroupTableResponse';
import { WordCloudResponse } from '@core/common/domain/response/query/WordCloudResponse';
import { TreeMapResponse } from '@core/common/domain/response/query/TreeMapResponse';
import { MapResponse } from '@core/common/domain/response/query/MapResponse';
import { isFunction } from 'lodash';
import { GenericChartResponse } from '@core/common/domain';

export enum VizResponseType {
  SeriesOneResponse = 'series_one_response',
  SeriesTwoResponse = 'series_two_response',
  /**
   * @deprecated from v1.0.0
   */
  DrilldownResponse = 'drilldown_response',
  TableResponse = 'viz_table_response',
  GroupedTableResponse = 'json_table_response',
  WordCloudResponse = 'word_cloud_response',
  TreeMapResponse = 'tree_map_response',
  MapResponse = 'map_response',
  GenericChartResponse = 'generic_chart_response'
}

export abstract class DimensionListing {
  abstract getDimensions(): string[];

  static isDimensionListing(obj: any): obj is DimensionListing {
    return obj && isFunction(obj.getDimensions);
  }
}

export abstract class VisualizationResponse {
  abstract className: VizResponseType;

  static fromObject(obj: any): VisualizationResponse {
    switch (obj.className) {
      case VizResponseType.SeriesOneResponse:
        return SeriesOneResponse.fromObject(obj);
      case VizResponseType.SeriesTwoResponse:
        return SeriesTwoResponse.fromObject(obj);
      case VizResponseType.DrilldownResponse:
        return DrilldownResponse.fromObject(obj);
      case VizResponseType.TableResponse:
        return TableResponse.fromObject(obj);
      case VizResponseType.GroupedTableResponse:
        return GroupTableResponse.fromObject(obj);
      case VizResponseType.WordCloudResponse:
        return WordCloudResponse.fromObject(obj);
      case VizResponseType.TreeMapResponse:
        return TreeMapResponse.fromObject(obj);
      case VizResponseType.MapResponse:
        return MapResponse.fromObject(obj);
      case VizResponseType.GenericChartResponse:
        return GenericChartResponse.fromObject(obj);
      default:
        throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }

  abstract hasData(): boolean;

  static empty(type: VizResponseType): VisualizationResponse {
    switch (type) {
      case VizResponseType.SeriesOneResponse:
        return SeriesOneResponse.empty();
      case VizResponseType.SeriesTwoResponse:
        return SeriesTwoResponse.empty();
      case VizResponseType.DrilldownResponse:
        return DrilldownResponse.empty();
      case VizResponseType.TableResponse:
        return TableResponse.empty();
      case VizResponseType.GroupedTableResponse:
        return GroupTableResponse.empty();
      case VizResponseType.WordCloudResponse:
        return WordCloudResponse.empty();
      case VizResponseType.TreeMapResponse:
        return TreeMapResponse.empty();
      case VizResponseType.MapResponse:
        return MapResponse.empty();
      case VizResponseType.GenericChartResponse:
        return GenericChartResponse.empty();
      default:
        throw new ClassNotFound(`empty: object with className ${type} not found`);
    }
  }
}
