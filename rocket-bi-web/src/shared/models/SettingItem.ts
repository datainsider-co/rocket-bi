/*
 * @author: tvc12 - Thien Vi
 * @created: 12/9/20, 2:26 PM
 */

import { SelectOption, SettingItemType } from '@/shared';

export class SettingItem {
  key: string;
  name: string;
  value: any;
  type: SettingItemType;
  highchartKey: string;
  defaultValue: string;
  options?: SelectOption[];
  innerSettingItems?: SettingItem[];

  constructor(key: string, name: string, value: any, type: SettingItemType, highchartKey: string, options?: SelectOption[], innerSettingItems?: SettingItem[]) {
    this.key = key;
    this.name = name;
    this.value = value;
    this.type = type;
    this.highchartKey = highchartKey;
    this.defaultValue = value;
    this.options = options ?? [];
    this.innerSettingItems = innerSettingItems;
  }

  static fromObject(obj: any): SettingItem {
    const innerSettingItems = obj.innerSettingItems ? obj.innerSettingItems.map((setting: any) => SettingItem.fromObject(setting)) : [];
    return new SettingItem(obj.key, obj.name, obj.value, obj.type, obj.highchartKey, obj.options, innerSettingItems);
  }

  static default(type = SettingItemType.input) {
    return new SettingItem('', '', '', type, '');
  }

  static toggle(key: string, name: string, value: boolean, highchartKey: string) {
    return new SettingItem(key, name, value, SettingItemType.toggle, highchartKey);
  }

  updateItem(key: string, newValue: any, options?: SelectOption[]) {
    if (this.key == key) {
      this.value = newValue;
      if (options) {
        this.options = Array.from(options);
      }
    }
  }
}
