import { CohortType } from '@core/cdp';

export abstract class CohortUtils {
  static isMultiCohort(type: CohortType | undefined | null): boolean {
    switch (type) {
      case CohortType.Single:
        return false;
      case CohortType.And:
      case CohortType.Or:
        return true;
      default:
        return false;
    }
  }

  static isSingleCohort(type: CohortType | undefined | null): boolean {
    switch (type) {
      case CohortType.Single:
        return true;
      case CohortType.And:
      case CohortType.Or:
        return false;
      default:
        return false;
    }
  }
}
