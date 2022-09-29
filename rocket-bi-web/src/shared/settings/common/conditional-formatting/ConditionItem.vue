<template>
  <div class="rule-condition">
    <DiDropdown
      :id="`${id}-type`"
      :data="conditionOptions"
      :value="condition.conditionType"
      class="condition-type"
      valueProps="type"
      :appendAtRoot="true"
      @change="handleConditionTypeChanged"
    />
    <template v-if="isBlank">
      <div class="condition-input"></div>
      <div class="value-type"></div>
    </template>
    <template v-else>
      <InputSetting
        :id="`${id}-value`"
        :class="{ 'input-error': isValueError }"
        :value="condition.value"
        class="condition-input"
        @onChanged="handleValueChanged"
      />
      <DiDropdown
        :appendAtRoot="true"
        :id="`${id}-value-type`"
        :data="valueTypeOptions"
        :value="condition.valueType"
        class="value-type"
        valueProps="type"
        @change="handleValueTypeChanged"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { RuleCondition, RuleType, ValueType } from '@core/common/domain';
import { LabelNode } from '@/shared';
import { cloneDeep } from 'lodash';
import { RuleUtils } from '@/shared/settings/common/conditional-formatting/RuleUtils';

export enum ConditionItemType {
  FirstCondition = 'first_condition',
  SecondCondition = 'second_condition'
}

@Component
export default class ConditionItem extends Vue {
  private static FirstConditionOptions: LabelNode[] = [
    {
      type: RuleType.GreaterThan,
      label: '>'
    },
    {
      type: RuleType.GreaterThanOrEqual,
      label: '>='
    },
    {
      type: RuleType.Is,
      label: '='
    },
    {
      type: RuleType.Blank,
      label: 'blank'
    }
  ];
  private static SecondConditionOptions: LabelNode[] = [
    {
      type: RuleType.LessThan,
      label: '<'
    },
    {
      type: RuleType.LessThanOrEqual,
      label: '<='
    }
  ];

  private readonly valueTypeOptions: LabelNode[] = [
    {
      type: ValueType.Number,
      label: 'Number'
    },
    {
      type: ValueType.Percentage,
      label: 'Percent'
    }
  ];

  @Prop({ required: true, type: String })
  private readonly id!: string;

  @Prop({ required: true })
  private readonly condition!: RuleCondition;

  @Prop({ required: true, type: String })
  private readonly type!: ConditionItemType;

  private get conditionOptions(): LabelNode[] {
    switch (this.type) {
      case ConditionItemType.FirstCondition:
        return ConditionItem.FirstConditionOptions;
      default:
        return ConditionItem.SecondConditionOptions;
    }
  }

  private get isBlank(): boolean {
    return this.condition.conditionType === RuleType.Blank;
  }

  private get isValueError(): boolean {
    return RuleUtils.isNotValid(this.condition);
  }

  private handleConditionTypeChanged(conditionType: RuleType): void {
    this.emitConditionChanged({
      conditionType: conditionType
    } as any);
  }

  private handleValueTypeChanged(valueType: ValueType): void {
    this.emitConditionChanged({
      valueType: valueType
    } as any);
  }

  private handleValueChanged(value: string): void {
    this.emitConditionChanged({
      value: value
    } as any);
  }

  @Emit('update:condition')
  private emitConditionChanged(condition: RuleCondition): RuleCondition {
    const clonedCondition = cloneDeep(this.condition);
    return Object.assign(clonedCondition, condition);
  }
}
</script>

<style lang="scss">
.rule-condition {
  align-items: center;
  cursor: default;

  display: flex;
  //height: 34px;
  //background: red;

  > div + div {
    margin-left: 8px;
  }

  > div.condition-type,
  div.value-type {
    height: 34px;
    margin-top: 0;
    width: 90px;

    button > div {
      height: unset !important;
    }
  }

  > div.condition-input {
    width: 56px;

    &.input-error {
      outline: 1px solid var(--danger);

      input {
        height: 33px;
      }
    }

    input {
      height: 34px;
    }
  }
}
</style>
