/*
 * @author: tvc12 - Thien Vi
 * @created: 5/27/21, 11:32 AM
 */

import { SeriesOneResponse } from './SeriesOneRespone';
import { SeriesTwoResponse } from './SeriesTwoResponse';
import { DrilldownResponse } from './DrilldownResponse';
import { TableResponse } from './TableResponse';
import { ClassNotFound } from '@core/domain/Exception/ClassNotFound';
import { GroupTableResponse } from '@core/domain/Response/Query/GroupTableResponse';
import { WordCloudResponse } from '@core/domain/Response/Query/WordCloudResponse';
import { TreeMapResponse } from '@core/domain/Response/Query/TreeMapResponse';
import { MapResponse } from '@core/domain/Response/Query/MapResponse';
import { isFunction } from 'lodash';

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
  MapResponse = 'map_response'
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
      default:
        throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }

  abstract hasData(): boolean;
}
