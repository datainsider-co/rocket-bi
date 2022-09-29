/*
 * @author: tvc12 - Thien Vi
 * @created: 3/29/21, 11:47 AM
 */

import { ChartInfo, QueryRelatedWidget, WidgetId } from '@core/common/domain/model';

export interface WidgetFullSizeHandler {
  showFullSize(chartInfo: QueryRelatedWidget): void;
  hideFullSize(): void;
}
