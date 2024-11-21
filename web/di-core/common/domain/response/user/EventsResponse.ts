/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:02 PM
 */

import { Event } from '@core/common/domain';
import { PageResult } from '@core/common/domain/response/PageResult';

export class EventsResponse extends PageResult<Event> {
  constructor(data: Event[], total: number) {
    super(data, total);
  }

  static fromObject(obj: EventsResponse): EventsResponse {
    return new EventsResponse(obj.data, obj.total);
  }
}
