/*
 * @author: tvc12 - Thien Vi
 * @created: 5/21/21, 12:11 PM
 */

import { SortDirection } from '@core/domain/Request';

export abstract class Sortable {
  static isSortable(obj: any): obj is Sortable {
    return !!obj.applySort;
  }

  abstract applySort(sortAsMap: Map<string, SortDirection>): void;
}
