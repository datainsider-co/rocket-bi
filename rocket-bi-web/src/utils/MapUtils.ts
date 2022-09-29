import { DIMap } from '@core/common/domain/model';
import { StringUtils } from '@/utils/StringUtils';

abstract class MapUtils {
  static isEmpty(map: DIMap<any>): boolean {
    return Object.keys(map).length === 0 && map.constructor === Object;
  }

  static isNotEmpty(map: DIMap<any>): boolean {
    return Object.keys(map).length > 0 && map.constructor === Object;
  }

  static toList<V, T>(diMap: DIMap<V> | undefined, callbackFn: (key: number, value: V, index: number) => T): T[] {
    if (diMap) {
      return Object.keys(diMap).map((rawKey, index) => {
        const key = +rawKey;
        return callbackFn(key, diMap[key], index);
      });
    } else return [];
  }

  static remove(map: DIMap<any>, id: number): DIMap<any> {
    if (id in map) {
      delete map[id];
    }
    return { ...map };
  }

  static map<Key, Value, T>(map: Map<Key, Value> | undefined, toItem: (key: Key, value: Value) => T): T[] {
    if (this.isEmpty(this.map)) {
      return [];
    } else {
      const list: T[] = [];
      map?.forEach((value, key) => {
        const item: T = toItem(key, value);
        list.push(item);
      });
      return list;
    }
  }

  static toDiMap<V>(map: Map<number, V>): DIMap<V> {
    const newMap: DIMap<V> = {};
    map.forEach((value, key) => {
      newMap[key] = value;
    });
    return newMap;
  }

  static toMap<V>(map: DIMap<V>): Map<number, V> {
    const newMap = new Map<number, V>();
    if (MapUtils.isNotEmpty(map)) {
      Object.keys(map).forEach(key => {
        newMap.set(+key, map[+key]);
      });
    }

    return newMap;
  }

  static merge<Key, Value>(currentMapValueSetting: Map<Key, Value>, valueWithSettingKey: Map<Key, Value>): Map<any, any> {
    for (const [key, value] of valueWithSettingKey) {
      currentMapValueSetting.set(key, value);
    }
    return currentMapValueSetting;
  }

  static removeContainsKey(currentValueAsMap: Map<string, any>, keywords: string[]) {
    const newMap = new Map();
    currentValueAsMap.forEach((value, key) => {
      const isNotExisted = !keywords.some(keyword => StringUtils.isIncludes(keyword, key));
      if (isNotExisted) {
        newMap.set(key, value);
      }
    });
    return newMap;
  }
}

export { MapUtils };
