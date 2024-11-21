/*
 * @author: tvc12 - Thien Vi
 * @created: 3/30/21, 12:09 PM
 */

import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { StringUtils } from '@/utils/StringUtils';
import { ChartUtils } from '@/utils';

export enum DataType {
  Text = 'TEXT',
  Date = 'DATE',
  Number = 'NUMBER',
  Expression = 'EXPRESSION',

  TabControl = 'TAB_CONTROL'
}

export abstract class FieldFilter {
  abstract getName(): string;

  abstract isPass(field: FieldDetailInfo, keyword?: string): boolean;
}

export class TextFieldFilter implements FieldFilter {
  getName(): string {
    return DataType.Text;
  }

  isPass(field: FieldDetailInfo, keyword?: string): boolean {
    if (keyword) {
      return StringUtils.isIncludes(field.displayName, keyword) && ChartUtils.isTextType(field.field.fieldType);
    } else {
      return ChartUtils.isTextType(field.field.fieldType);
    }
  }
}

export class NumberFieldFilter implements FieldFilter {
  getName(): string {
    return DataType.Number;
  }

  isPass(field: FieldDetailInfo, keyword?: string): boolean {
    if (keyword) {
      return StringUtils.isIncludes(field.displayName, keyword) && ChartUtils.isNumberType(field.field.fieldType);
    } else {
      return ChartUtils.isNumberType(field.field.fieldType);
    }
  }
}

export class DateFieldFilter implements FieldFilter {
  getName(): string {
    return DataType.Date;
  }

  isPass(field: FieldDetailInfo, keyword?: string): boolean {
    if (keyword) {
      return StringUtils.isIncludes(field.displayName, keyword) && ChartUtils.isDateType(field.field.fieldType);
    } else {
      return ChartUtils.isDateType(field.field.fieldType);
    }
  }
}
