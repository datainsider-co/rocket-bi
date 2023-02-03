import { DIMap } from '@core/common/domain/model';

export abstract class ListUtils {
  static isEmpty(list: any) {
    return !Array.isArray(list) || !list.length;
  }

  static isNotEmpty(list: any) {
    return Array.isArray(list) && !!list.length;
  }

  static remove<T>(list: T[], isRemove: (item: T, index: number) => boolean): T[] {
    if (this.isEmpty(list)) {
      return [];
    } else {
      return list.filter((item, index) => !isRemove(item, index));
    }
  }

  static removeAt<T>(list: T[], index: number): T[] {
    if (this.isNotEmpty(list)) {
      if (list.length === 1 && index === 0) {
        list.splice(-1, 1);
      } else {
        list.splice(index, 1);
      }
    }
    return list;
  }

  static swap<T>(list: T[], oldIndex: number, newIndex: number) {
    if (ListUtils.isNotEmpty(list)) {
      const temp = list[oldIndex];
      list[oldIndex] = list[newIndex];
      list[newIndex] = temp;
    }
    return list;
  }

  static toDiMap<V>(list: V[]): DIMap<V> {
    const newMap: DIMap<V> = {};
    list.forEach((value, key) => {
      newMap[key] = value;
    });
    return newMap;
  }

  static hasOnlyOneItem(list: any): boolean {
    return Array.isArray(list) && list.length === 1;
  }

  /// Return element in List, if index is out of range, will begin 0
  static getElementCycleList<T>(list: T[], index: number) {
    if (index > list.length - 1) {
      return list[index % list.length];
    }
    return list[index];
  }

  static getLast<T>(list: T[]): T | undefined {
    if (this.isNotEmpty(list)) {
      return list[list.length - 1];
    } else {
      return void 0;
    }
  }

  static getHead<T>(list: T[]): T | undefined {
    if (this.isNotEmpty(list)) {
      return list[0];
    } else {
      return void 0;
    }
  }

  static generate<T>(length: number, generator: (index: number) => T): T[] {
    return Array.from(
      {
        length: length
      },
      (_, index) => generator(index)
    );
  }

  static removeEnd<T>(children: T[], size: number): T[] {
    const length = children.length - size;
    if (length >= 0) {
      return children.slice(0, length) ?? [];
    } else {
      return [];
    }
  }

  ///@Param: arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  ///@Input: chunkSize = 3
  ///@Output: [[ 1, 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9 ], [ 10 ]]
  static sliceIntoChunks(arr: any[], chunkSize: number): any[] {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
    }
    return res;
  }

  static unique(list: string[]): string[] {
    return Array.from(new Set(list).values());
  }

  /**
   * find difference between two list, return list of element in listA but not in listB
   */
  static diff(listA: string[], listB: string[]): string[] {
    return listA.filter(item => !listB.includes(item));
  }

  /**
   * find intersection between two list, return list of element in listA and in listB
   */
  static intersection(listA: string[], listB: string[]) {
    return listA.filter(item => listB.includes(item));
  }
}
