/*
 * @author: tvc12 - Thien Vi
 * @created: 3/30/21, 12:12 PM
 */

import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';
import { StringUtils } from '@/utils/string.utils';

export abstract class MethodFieldSorting {
  abstract sort(fields: FieldDetailInfo[]): FieldDetailInfo[];
}

export class DefaultMethodFieldSorting implements MethodFieldSorting {
  sort(fields: FieldDetailInfo[]): FieldDetailInfo[] {
    return fields.sort((a, b) => StringUtils.compare(a.displayName, b.displayName));
  }
}
