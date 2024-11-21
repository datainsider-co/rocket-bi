/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:04 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:57 AM
 */

import { Widget } from '../Widget';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';

export abstract class QueryRelatedWidget extends Widget {
  abstract setting: QuerySetting;

  static isQueryRelatedWidget(obj: any): obj is QueryRelatedWidget {
    return !!obj.setting;
  }
}
