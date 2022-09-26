import { DateTimeFormatter, ListUtils } from '@/utils';
import { StringUtils } from '@/utils/string.utils';
import { ActivityResourceType } from '@core/Organization';

export class UserActivity {
  constructor(
    public actionName: string,
    public executionTime: number,
    public orgId: number,
    public param: string,
    public method: string,
    public path: string,
    public message: string,
    public username: string,
    public resourceType: ActivityResourceType,
    public timestamp: number,
    public isExpanded: boolean,
    public requestContent: string,
    public responseContent: string
  ) {}

  static fromObject(obj: UserActivity) {
    return new UserActivity(
      obj.actionName,
      obj.executionTime,
      obj.orgId,
      obj.param,
      obj.method,
      obj.path,
      obj.message,
      obj.username,
      obj.resourceType,
      obj.timestamp,
      false,
      obj.requestContent,
      obj.responseContent
    );
  }
}

export class UserActivityGroup {
  constructor(public groupName: string, public activityLogs: UserActivity[]) {}

  static fromUserActivities(userActivities: UserActivity[]): UserActivityGroup[] {
    const result: UserActivityGroup[] = [];
    let activities: UserActivity[] = [];
    let groupName = DateTimeFormatter.formatASMMMDDYYYY(new Date());
    userActivities.forEach((act, index) => {
      const name = DateTimeFormatter.formatASMMMDDYYYY(new Date(act.timestamp));
      if (groupName !== name) {
        if (ListUtils.isNotEmpty(activities)) {
          result.push(new UserActivityGroup(groupName, activities));
        }
        activities = [];
        groupName = name;
      }
      activities.push(act);
    });
    if (ListUtils.isNotEmpty(activities) && StringUtils.isNotEmpty(groupName)) {
      result.push(new UserActivityGroup(groupName, activities));
    }
    return result;
  }
}
