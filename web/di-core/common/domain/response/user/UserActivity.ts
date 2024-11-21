/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:02 PM
 */

import { Event, SubActivity, UserDetail } from '@core/common/domain';

export class UserActivity {
  eventId: string;
  sessionId: string;
  eventName: string;
  title: string;
  event: Event;
  subActivities: SubActivity;
  time: number;
  username: string;
  userDetail: UserDetail;

  constructor(
    eventId: string,
    sessionId: string,
    eventName: string,
    title: string,
    event: Event,
    subActivities: SubActivity,
    time: number,
    username: string,
    userDetail: UserDetail
  ) {
    this.eventId = eventId || '';
    this.sessionId = sessionId || '';
    this.eventName = eventName || '';
    this.title = title || '';
    this.event = event || {};
    this.subActivities = subActivities || {};
    this.time = time || 0;
    this.username = username || '';
    this.userDetail = userDetail || {};
  }

  static fromObject(obj: UserActivity): UserActivity {
    return new UserActivity(obj.eventId, obj.sessionId, obj.eventName, obj.title, obj.event, obj.subActivities, obj.time, obj.username, obj.userDetail);
  }
}
