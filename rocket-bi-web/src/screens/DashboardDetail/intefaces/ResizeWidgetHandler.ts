/*
 * @author: tvc12 - Thien Vi
 * @created: 4/1/21, 2:59 PM
 */

import { WidgetId } from '@core/domain/Model';

export interface WidgetResizeHandler {
  handleResize(id: WidgetId): void;
}
