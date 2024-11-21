import { ActivityActionType } from '@core/organization/domain/user-activity/ActivityActionType';
import { ActivityResourceType } from '@core/organization';

export class GetUserActivityRequest {
  constructor(
    public usernames: string[],
    public actionTypes: ActivityActionType[],
    public resourceTypes: ActivityResourceType[],
    public from: number,
    public size: number,
    public startTime?: number,
    public endTime?: number
  ) {}
}
