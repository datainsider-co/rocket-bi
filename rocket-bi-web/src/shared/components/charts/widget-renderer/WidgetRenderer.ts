/*
 * @author: tvc12 - Thien Vi
 * @created: 1/19/21, 5:36 PM
 */

import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';

export interface WidgetRenderer<W extends BaseWidget> {
  render(widget: W, h: any): any;
}
