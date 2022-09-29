/*
 * @author: tvc12 - Thien Vi
 * @created: 5/28/21, 4:43 PM
 */

import { IdGenerator } from '@/utils/IdGenerator';
import { TableColumn } from '@core/common/domain/model';
import { SettingItem } from '@/shared/models';
import { SettingItemType } from '@/shared';
import { ColorConfig } from '@core/common/domain/model/chart-option/extra-setting/ColorConfig';

export class TablePanelUtils {
  static readonly PREFIX_KEY = 'valueColors';

  static getGroupKey(index: number): string {
    return IdGenerator.generateKey([this.PREFIX_KEY, index.toString()]);
  }

  static createSettingMinColor(index: number): SettingItem {
    const key = IdGenerator.generateKey([this.getGroupKey(index), 'minColor']);
    return new SettingItem(key, 'Lower', '#F2E8D6', SettingItemType.color, key);
  }

  static createSettingMaxColor(index: number): SettingItem {
    const key = IdGenerator.generateKey([this.getGroupKey(index), 'maxColor']);
    return new SettingItem(key, 'Higher', '#FFAC05', SettingItemType.color, key);
  }

  static createSettingNoneColor(index: number): SettingItem {
    const key = IdGenerator.generateKey([this.getGroupKey(index), 'noneColor']);
    return new SettingItem(key, 'None', '#e8e8f5', SettingItemType.color, key);
  }

  static createSettingDisplayValue(index: number) {
    const key = IdGenerator.generateKey([this.getGroupKey(index), 'enableDisplayValue']);
    return new SettingItem(key, 'Display value', false, SettingItemType.toggle, key);
  }

  static createSettingTextStyle(index: number) {
    const key = IdGenerator.generateKey([this.getGroupKey(index), 'textStyle', 'color']);
    return new SettingItem(key, 'Value color', '#FFFFFFCC', SettingItemType.color, key);
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

  static createSettingValueColor(column: TableColumn, tableColumnIndex: number): SettingItem {
    const groupKey: string = TablePanelUtils.getGroupKey(tableColumnIndex);
    return new SettingItem(
      groupKey,
      column.name,
      false,
      SettingItemType.group,
      groupKey,
      [],
      [
        TablePanelUtils.createSettingMinColor(tableColumnIndex),
        TablePanelUtils.createSettingMaxColor(tableColumnIndex),
        TablePanelUtils.createSettingNoneColor(tableColumnIndex),
        TablePanelUtils.createSettingDisplayValue(tableColumnIndex),
        TablePanelUtils.createSettingTextStyle(tableColumnIndex)
      ]
    );
  }
}
