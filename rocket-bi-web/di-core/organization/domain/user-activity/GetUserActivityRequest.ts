import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import { ActivityActionType } from '@core/organization/domain/user-activity/ActivityActionType';

export class GetUserActivityRequest {
  constructor(
    public usernames: string[],
    public actionTypes: ActivityActionType[],
    public resourceTypes: ResourceType[],
    public from: number,
    public size: number,
    public startTime?: number,
    public endTime?: number
  ) {}
}
