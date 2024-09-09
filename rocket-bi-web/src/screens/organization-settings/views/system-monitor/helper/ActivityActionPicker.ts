import { ActivityActionType } from '@core/organization/domain/user-activity/ActivityActionType';
import { Route } from 'vue-router';

export class ActivityActionPicker {
  pick(router: Route): ActivityActionType | null {
    const activityAsString = router.query.activity?.toString();
    switch (activityAsString) {
      case ActivityActionType.View:
      case ActivityActionType.Update:
      case ActivityActionType.Create:
      case ActivityActionType.Delete:
      case ActivityActionType.Other:
        return activityAsString;
      default:
        return null;
    }
  }
}
