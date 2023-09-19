/*
 * @author: tvc12 - Thien Vi
 * @created: 1/8/21, 10:55 AM
 */
/* eslint max-len: 0 */

import { ConditionBuilder } from '@core/common/services/condition-builder/ConditionBuilder';
import { Condition, DynamicValueCondition, DynamicValueExtraData, ValueControlType } from '@core/common/domain/model';
import { ConditionData } from '@/shared';
import { cloneDeep } from 'lodash';

export class DynamicConditionBuilder implements ConditionBuilder {
  private baseBuilder: ConditionBuilder;
  constructor(builder: ConditionBuilder) {
    this.baseBuilder = builder;
  }

  buildCondition(condition: ConditionData): Condition | undefined {
    // override for created base condition
    const baseCondition: Condition | undefined = this.baseBuilder.buildCondition({
      ...condition,
      firstValue: '0',
      secondValue: '0',
      allValues: ['0', '0'],
      controlId: void 0
    });
    if (baseCondition) {
      const extraData: DynamicValueExtraData = { controlTypes: condition.allValues as ValueControlType[] };
      const finalCondition: Condition | undefined = void 0;
      return new DynamicValueCondition(baseCondition, condition.controlId!, finalCondition, extraData);
    } else {
      return void 0;
    }
  }
}
