import { SearchAnalyticsDataState, SearchAnalyticsType } from '@core/data-ingestion';

export interface SearchAnalyticsConfig {
  type: SearchAnalyticsType;
  dataState: SearchAnalyticsDataState;
}
