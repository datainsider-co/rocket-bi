import { ActivityResourceType } from '@core/organization';
import { Route } from 'vue-router';

export class ActivityResourcePicker {
  pick(router: Route): ActivityResourceType | null {
    const resourceAsString = router.query.resource?.toString();
    switch (resourceAsString) {
      case ActivityResourceType.Dashboard:
      case ActivityResourceType.Directory:
      case ActivityResourceType.Widget:
      case ActivityResourceType.Database:
      case ActivityResourceType.Etl:
      case ActivityResourceType.Table:
      case ActivityResourceType.Source:
      case ActivityResourceType.Job:
        return resourceAsString;
      default:
        return null;
    }
  }
}
