import { DIException, RlsPolicy } from '@core/common/domain';
import { ListUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';

export enum UserAttributeOperator {
  Equal = 'Equal',
  NotEqual = 'NotEqual',
  Contain = 'Contain',
  NotContain = 'NotContain',
  IsNull = 'IsNull',
  IsNotNull = 'IsNotNull'
}

export class UserAttribute {
  key: string;
  values: string[];
  operator: UserAttributeOperator;

  constructor(key: string, values: string[], operator: UserAttributeOperator) {
    this.key = key;
    this.values = values;
    this.operator = operator;
  }

  static empty(): UserAttribute {
    return new UserAttribute('', [], UserAttributeOperator.IsNull);
  }

  static fromObject(obj: any): UserAttribute {
    return new UserAttribute(obj.key, obj.values, obj.operator);
  }
}
