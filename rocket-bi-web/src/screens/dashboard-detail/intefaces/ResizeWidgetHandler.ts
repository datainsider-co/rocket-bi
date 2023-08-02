/*
 * @author: tvc12 - Thien Vi
 * @created: 4/1/21, 2:59 PM
 */

import { WidgetId } from '@core/common/domain/model';

export interface WidgetResizeHandler {
  handleResize(id: WidgetId): void;
}
