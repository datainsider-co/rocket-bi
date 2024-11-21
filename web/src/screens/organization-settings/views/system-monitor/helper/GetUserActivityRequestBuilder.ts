import { ActivityResourceType, GetUserActivityRequest } from '@core/organization';
import { ActivityActionType } from '@core/organization/domain/user-activity/ActivityActionType';

export class GetUserActivityRequestBuilder {
  private usernames: string[];
  private from: number;
  private size: number;

  private startTime?: number;
  private endTime?: number;
  private activity: ActivityActionType | null;
  private resource: ActivityResourceType | null;

  constructor() {
    this.usernames = [];
    this.from = 0;
    this.size = 50;
    this.startTime = void 0;
    this.endTime = void 0;
    this.activity = null;
    this.resource = null;
  }

  withKeyword(usernames: string[]): GetUserActivityRequestBuilder {
    this.usernames = usernames;
    return this;
  }

  withFrom(from: number): GetUserActivityRequestBuilder {
    this.from = from;
    return this;
  }

  withSize(size: number): GetUserActivityRequestBuilder {
    this.size = size;
    return this;
  }

  withDateRange(range: { start: number; end: number } | null): GetUserActivityRequestBuilder {
    if (range) {
      const { start, end } = range;
      this.startTime = start;
      this.endTime = end;
    } else {
      this.startTime = void 0;
      this.endTime = void 0;
    }
    return this;
  }

  withActivity(activity: ActivityActionType | null): GetUserActivityRequestBuilder {
    this.activity = activity;
    return this;
  }

  withResource(resource: ActivityResourceType | null): GetUserActivityRequestBuilder {
    this.resource = resource;
    return this;
  }

  getResult(): GetUserActivityRequest {
    return new GetUserActivityRequest(
      this.usernames,
      this.activity ? [this.activity] : [],
      this.resource ? [this.resource] : [],
      this.from,
      this.size,
      this.startTime,
      this.endTime
    );
  }
}
