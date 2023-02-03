/*
 * @author: tvc12 - Thien Vi
 * @created: 5/28/21, 4:37 PM
 */

import { identity, isArray, isMap, isNumber, isObject, isSet, isString, pickBy, set } from 'lodash';
import { ListUtils } from '@/utils';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { JsonUtils } from '@core/utils/JsonUtils';
import { StringUtils } from '@/utils/StringUtils';

export enum ObjectType {
  Normal, // string, number, vvv
  Object,
  Array,
  Map,
  Set
}

export class ObjectUtils {
  private static arrayRegex = /(\w+)\[(\d+)]/;

  /**
   * Remove key has value undefined and null
   * @param obj obj will remove key
   */
  static removeKeyIfValueNotExist(obj: any): any {
    if (isObject(obj)) {
      return pickBy(obj, identity);
    } else {
      return {};
    }
  }

  static getHead(obj: any): any | undefined {
    const firstKey = ListUtils.getHead(Object.keys(obj));
    if (isNumber(firstKey) || isString(firstKey)) {
      return obj[firstKey];
    } else {
      return void 0;
    }
  }

  static fromMap<Key, Value>(map: Map<Key, Value>): any {
    return Object.fromEntries(map);
  }

  static toObject(key: string, value: any): any {
    const subKeys = ObjectUtils.getSubKeys(key);
    if (ListUtils.isEmpty(subKeys)) {
      return {};
    } else {
      return this.createObjectFromKeys(subKeys, value);
    }
  }

  static getSubKeys(primaryKey: string, separator = '.'): string[] {
    return primaryKey.split(separator).flatMap(key => {
      if (this.arrayRegex.test(key)) {
        const groups: string[] = this.arrayRegex.exec(key) ?? [];
        return [groups[1], groups[2]];
      } else {
        return [key];
      }
    });
  }

  static createObjectFromKeys(keys: string[], value: any): any {
    const keyReversed = keys.reverse();
    const firstKey: string = keyReversed[0];
    let obj: any = {};
    obj[firstKey] = value;
    for (let index = 1; index < keyReversed.length; index++) {
      const key: string = keyReversed[index];
      const newObject: any = {};
      newObject[key] = obj;
      obj = newObject;
    }
    return obj;
  }

  static flatKey(data: any): Map<string, any> {
    const result = new Map();
    Object.entries(data).forEach(([key, value]) => {
      ObjectUtils.processNestedKeyValue(result, key, value);
    });
    return result;
  }

  static mergeStyles(styles: CustomStyleData[]): CustomStyleData {
    let finalCustomStyle: any = { css: {} };
    styles.forEach(style => {
      finalCustomStyle = JsonUtils.mergeDeep(finalCustomStyle, style);
    });
    return finalCustomStyle;
  }

  static findStartWithKey(obj: any, normalizedName: string): any | undefined {
    const [_, value] = Object.entries(obj).find(([key, data]) => key.startsWith(normalizedName)) ?? [];
    return value;
  }

  static toCssAsString(style: any): string {
    return Object.entries(style)
      .map(([key, value]) => {
        return `${StringUtils.toKebabCase(key)}: ${value};`;
      })
      .join(' ');
  }

  // key: abc.xyz
  private static processObjectValue(result: Map<string, any>, prefixKey: string, currentData: any): void {
    Object.entries(currentData).forEach(([key, value]) => {
      const currentKey = `${prefixKey}.${key}`;
      ObjectUtils.processNestedKeyValue(result, currentKey, value);
    });
  }

  // key: abc[index]
  private static processArrayValue(result: Map<string, any>, prefixKey: string, currentData: any[]): void {
    currentData.forEach((value, index) => {
      const currentKey = `${prefixKey}[${index}]`;
      this.processNestedKeyValue(result, currentKey, value);
    });
  }

  // key: abc[index]
  private static processMapValue(result: Map<string, any>, prefixKey: string, currentData: Map<string, any>): void {
    currentData.forEach((value, key) => {
      const currentKey = `${prefixKey}.${key}`;
      this.processNestedKeyValue(result, currentKey, value);
    });
  }

  private static processNestedKeyValue(result: Map<string, any>, prefixKey: string, currentData: any): void {
    const objectType = ObjectUtils.getObjectType(currentData);
    switch (objectType) {
      case ObjectType.Array:
        ObjectUtils.processArrayValue(result, prefixKey, currentData);
        break;
      case ObjectType.Object:
        ObjectUtils.processObjectValue(result, prefixKey, currentData);
        break;
      case ObjectType.Map:
        ObjectUtils.processMapValue(result, prefixKey, currentData as Map<string, any>);
        break;
      case ObjectType.Set:
        result.set(prefixKey, currentData);
        break;
      default:
        result.set(prefixKey, currentData);
    }
  }

  private static getObjectType(currentData: any): ObjectType {
    if (isArray(currentData)) {
      return ObjectType.Array;
    }
    if (isObject(currentData)) {
      return ObjectType.Object;
    }
    if (isMap(currentData)) {
      return ObjectType.Map;
    }
    if (isSet(currentData)) {
      return ObjectType.Set;
    }
    return ObjectType.Normal;
  }

  static set(obj: any, key: string, value: any) {
    set(obj, key, value);
  }

  static isEmpty(obj: any): boolean {
    return Object.keys(obj).length === 0;
  }

  static isNotEmpty(obj: any): boolean {
    return Object.keys(obj).length > 0;
  }
}
