import { Condition, ConditionType, DIException, PolicyId, UserAttributeOperator } from '@core/domain';
import { UserAttribute } from './UserAttribute';
import { StringUtils } from '@/utils/string.utils';
import { ListUtils } from '@/utils';

export class RlsPolicy {
  policyId: PolicyId;
  name: string;
  userIds?: string[];
  userAttribute: UserAttribute;
  dbName: string;
  tblName: string;
  conditions?: Condition[];

  constructor(
    policyId: PolicyId,
    name: string,
    userIds: string[] | undefined,
    userAttribute: UserAttribute,
    dbName: string,
    tblName: string,
    conditions: Condition[]
  ) {
    this.policyId = policyId;
    this.name = name;
    this.userIds = userIds;
    this.userAttribute = userAttribute;
    this.dbName = dbName;
    this.tblName = tblName;
    this.conditions = conditions;
  }

  static empty(): RlsPolicy {
    return new RlsPolicy(-1, '', [], UserAttribute.empty(), '', '', []);
  }

  static fromObject(obj: RlsPolicy): RlsPolicy {
    const attribute = UserAttribute.fromObject(obj.userAttribute);
    const conditions = obj.conditions ? obj.conditions?.map(condition => Condition.fromObject(condition)) : [];
    return new RlsPolicy(obj.policyId, obj.name, obj.userIds, attribute, obj.dbName, obj.tblName, conditions);
  }

  withDatabaseName(name: string): RlsPolicy {
    this.dbName = name;
    return this;
  }
  withTableName(name: string): RlsPolicy {
    this.tblName = name;
    return this;
  }

  ensurePolicy() {
    this.ensureAttributeName();
    this.ensureAttributeValue();
  }

  private ensureAttributeName() {
    if (StringUtils.isEmpty(this.userAttribute.key)) {
      throw new DIException(`Attribute name is required.`);
    }
  }

  private ensureAttributeValue() {
    switch (this.userAttribute.operator) {
      case UserAttributeOperator.Contain: {
        if (ListUtils.isEmpty(this.userAttribute.values)) {
          throw new DIException(`Attribute "${this.userAttribute.key}" values is required.`);
        }
        break;
      }
      case UserAttributeOperator.Equal: {
        if (StringUtils.isEmpty(this.userAttribute.values[0])) {
          throw new DIException(`Attribute "${this.userAttribute.key}" value is required.`);
        }
        break;
      }
    }
  }

  get isAlwaysTrueCondition() {
    return this.conditions && this.conditions[0]?.className === ConditionType.AlwaysTrue;
  }

  get isAlwaysFalseCondition() {
    return this.conditions && this.conditions[0]?.className === ConditionType.AlwaysFalse;
  }

  get isEmptyConditions() {
    return ListUtils.isEmpty(this.conditions);
  }
}
