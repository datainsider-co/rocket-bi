import { DIException, RlsPolicy } from '@core/domain';
import { ListUtils } from '@/utils';
import { StringUtils } from '@/utils/string.utils';

export enum UserAttributeOperator {
  Equal = 'Equal',
  Contain = 'Contain',
  IsNull = 'IsNull'
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

  get isEqualOperator() {
    return this.operator === UserAttributeOperator.Equal;
  }

  get isNullOperator() {
    return this.operator === UserAttributeOperator.IsNull;
  }

  get isInOperator() {
    return this.operator === UserAttributeOperator.Contain;
  }
}
