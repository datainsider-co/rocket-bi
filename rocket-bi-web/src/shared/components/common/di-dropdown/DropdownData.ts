/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 11:14 AM
 */

import { DropdownType } from '@/shared/components/common/di-dropdown/DropdownType';

export interface DropdownData {
  type?: DropdownType;
  options?: DropdownData[];

  [key: string]: any;
}
