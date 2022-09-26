/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:06 PM
 */

import { WidgetExtraData, WidgetId } from '@core/domain/Model';

export interface WidgetCommonData {
  id: WidgetId;
  name: string;
  description: string;
  extraData?: WidgetExtraData;
  backgroundColor?: string;
  textColor?: string;
}
