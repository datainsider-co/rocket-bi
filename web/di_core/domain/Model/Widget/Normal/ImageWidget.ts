/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:04 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:50 AM
 */

import { WidgetCommonData, Widgets } from '@core/domain/Model';
import { RandomUtils } from '@/utils';
import { Widget } from '../Widget';

/**
 * @deprecated from v1.0.0
 */
export class ImageWidget extends Widget {
  className = Widgets.Image;
  url: string;

  constructor(commonSetting: WidgetCommonData, url: string) {
    super(commonSetting);
    this.url = url;
  }

  static fromUrl(url: string): ImageWidget {
    return new ImageWidget({ id: RandomUtils.nextInt(), name: 'Image', description: '' }, url);
  }

  static fromObject(obj: ImageWidget): ImageWidget {
    return new ImageWidget(obj, obj.url);
  }
}
