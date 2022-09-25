/*
 * @author: tvc12 - Thien Vi
 * @created: 5/21/21, 12:14 PM
 */

import { ZoomData } from '@/shared';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';

export abstract class Zoomable {
  abstract get zoomData(): ZoomData;

  abstract buildNewZoomData(data: ZoomData, nextLvl: string): ZoomData;

  abstract setZoomData(data: ZoomData): void;

  static isZoomable(query: QuerySetting | Zoomable): query is Zoomable {
    return (query as Zoomable)?.zoomData !== undefined;
  }
}
