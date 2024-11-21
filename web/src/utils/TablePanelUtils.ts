/*
 * @author: tvc12 - Thien Vi
 * @created: 5/28/21, 4:43 PM
 */

import { IdGenerator } from '@/utils/IdGenerator';
import { ColorConfig } from '@core/common/domain/model/chart-option/extra-setting/ColorConfig';

export class TablePanelUtils {
  static readonly PREFIX_KEY = 'valueColors';

  static getGroupKey(index: number): string {
    return IdGenerator.generateKey([this.PREFIX_KEY, index.toString()]);
  }

  static bindTextStyle(cssStyle: CSSStyleDeclaration, textStyle: ColorConfig) {
    if (textStyle.enableDisplayValue) {
      if (textStyle.textStyle) {
        Object.assign(cssStyle, textStyle.textStyle);
      }
    } else {
      cssStyle.color = 'transparent';
    }
  }
}
