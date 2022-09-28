import { ActionType, ResourceType } from '@/utils/permission_utils';
import { ActivityActionType } from '@core/Organization/Domain/UserActivity/ActivityActionType';

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
