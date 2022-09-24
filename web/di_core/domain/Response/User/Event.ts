/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:02 PM
 */

export class Event {
  name: string;
  displayName: string;
  isSystemEvent: boolean;
  sessionId?: string;
  eventId?: string;
  eventName?: string;
  screenName?: string;
  url?: string;
  platform?: string;
  duration?: number;
  timInMs?: number;

  constructor(
    name: string,
    displayName: string,
    isSystemEvent: boolean,
    sessionId?: string,
    eventId?: string,
    eventName?: string,
    screenName?: string,
    url?: string,
    platform?: string,
    duration?: number,
    timInMs?: number
  ) {
    this.name = name;
    this.displayName = displayName;
    this.isSystemEvent = isSystemEvent;
    this.sessionId = sessionId;
    this.eventId = eventId;
    this.eventName = eventName;
    this.screenName = screenName;
    this.url = url;
    this.platform = platform;
    this.duration = duration;
    this.timInMs = timInMs;
  }

  static fromObject(obj: Event): Event {
    return new Event(
      obj.name,
      obj.displayName,
      obj.isSystemEvent,
      obj.sessionId,
      obj.eventId,
      obj.eventName,
      obj.screenName,
      obj.url,
      obj.platform,
      obj.duration,
      obj.timInMs
    );
  }
}
