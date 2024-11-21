import { GaDate } from '@core/data-ingestion/domain/job/google-analytic/GaDate';

export interface GaDateRange {
  startDate: GaDate | Date | string;
  endDate: GaDate | Date | string;
}
