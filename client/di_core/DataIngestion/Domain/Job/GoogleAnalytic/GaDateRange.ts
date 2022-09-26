import { GaDate } from '@core/DataIngestion/Domain/Job/GoogleAnalytic/GaDate';

export interface GaDateRange {
  startDate: GaDate | Date | string;
  endDate: GaDate | Date | string;
}
