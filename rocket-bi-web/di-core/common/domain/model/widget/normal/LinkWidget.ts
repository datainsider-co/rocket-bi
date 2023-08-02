/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:04 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:51 AM
 */

import { Position, WidgetCommonData, Widgets } from '@core/common/domain/model';
import { Widget } from '../Widget';

/**
 * @deprecated from v1.0.0
 */
export class LinkWidget extends Widget {
  className = Widgets.Link;
  url: string;
  displayText: string;
  // fontSize: number;
  // fontColor: string;

  constructor(commonSetting: WidgetCommonData, url: string, displayText: string) {
    super(commonSetting);
    this.url = url;
    this.displayText = displayText;
    // this.fontSize = fontSize;
    // this.fontColor = fontColor;
  }

  static fromObject(obj: LinkWidget): LinkWidget {
    return new LinkWidget(obj, obj.url, obj.displayText);
  }

  getDefaultPosition(): Position {
    return new Position(-1, -1, 8, 3, 1);
  }
}
