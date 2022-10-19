/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:04 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:51 AM
 */

import { WidgetCommonData, Widgets } from '@core/common/domain/model';
import { Widget } from '../Widget';

export class TextWidget extends Widget {
  className = Widgets.Text;
  content: string;
  fontSize: string;
  isHtmlRender: boolean;

  constructor(commonSetting: WidgetCommonData, content: string, fontSize: string, isHtmlRender: boolean) {
    super(commonSetting);
    this.content = content;
    this.fontSize = fontSize;
    this.isHtmlRender = isHtmlRender;
  }

  static empty() {
    return new TextWidget(
      {
        id: -1,
        name: '',
        description: '',
        textColor: 'var(--text-color)',
        backgroundColor: 'var(--input-background-color)'
      },
      '',
      '12px',
      false
    );
  }

  static fromObject(obj: TextWidget): TextWidget {
    return new TextWidget(obj, obj.content, obj.fontSize, obj.isHtmlRender);
  }
}
