import { Route } from 'vue-router';
import { MainDateMode } from '@core/common/domain';

export class MainDateModePicker {
  pick(router: Route): MainDateMode | null {
    const mode = router.query?.dateRange?.toString();
    switch (mode) {
      case MainDateMode.thisDay:
      case MainDateMode.thisWeek:
      case MainDateMode.thisMonth:
      case MainDateMode.thisQuarter:
      case MainDateMode.thisYear:
      case MainDateMode.lastDay:
      case MainDateMode.lastWeek:
      case MainDateMode.lastMonth:
      case MainDateMode.lastQuarter:
      case MainDateMode.lastYear:
      case MainDateMode.last7Days:
      case MainDateMode.last30Days:
      case MainDateMode.allTime:
      case MainDateMode.previousPeriod:
      case MainDateMode.samePeriodLastYear:
      case MainDateMode.samePeriodLastMonth:
      case MainDateMode.samePeriodLastQuarter:
      case MainDateMode.custom:
        return mode;
      default:
        return null;
    }
  }
}
