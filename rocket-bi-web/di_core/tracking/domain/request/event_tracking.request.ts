export class EventsRequest {
  username: string;
  from?: number;
  size?: number;

  constructor(username: string, from?: number, size?: number) {
    this.username = username || '';
    this.from = from || -1;
    this.size = size || -1;
  }
}

export class GetUserActivityRequest {
  username: string;
  fromTime: number;
  toTime: number;
  includeEvents: string[];
  from?: number;
  size?: number;

  constructor(username: string, fromTime: number, toTime: number, includeEvents: string[], from?: number, size?: number) {
    this.username = username || '';
    this.fromTime = fromTime || new Date().getTime();
    this.toTime = toTime || new Date().getTime();
    this.includeEvents = includeEvents || [];
    this.from = from || 0;
    this.size = size || -1;
  }
}

export class GetUserActivityByEventIdRequest {
  eventId: string;
  from?: number;
  size?: number;

  constructor(eventId: string, from?: number, size?: number) {
    this.eventId = eventId || '';
    this.from = from || 0;
    this.size = size || -1;
  }
}
