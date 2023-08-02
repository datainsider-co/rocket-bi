/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:04 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:50 AM
 */

import { Position, WidgetCommonData, WidgetExtraData, WidgetId, Widgets } from '@core/common/domain/model';
import { RandomUtils, StringUtils } from '@/utils';
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

  get isEmpty() {
    return StringUtils.isEmpty(this.url);
  }

  get isCreate() {
    return this.id === -1;
  }

  static fromUrl(url: string): ImageWidget {
    return new ImageWidget({ id: RandomUtils.nextInt(), name: 'Image', description: '' }, url);
  }

  static fromObject(obj: ImageWidget): ImageWidget {
    return new ImageWidget(obj, obj.url);
  }

  static empty() {
    return new ImageWidget(
      {
        id: -1,
        name: '',
        description: '',
        textColor: 'var(--text-color)',
        backgroundColor: 'var(--chart-background-color)'
      },
      ''
    );
  }

  getDefaultPosition(): Position {
    return new Position(-1, -1, 10, 8, 1);
  }
}
