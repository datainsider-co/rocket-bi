<template>
  <div class="rule-item">
    <h6>If value</h6>
    <ConditionItem :id="`first-condition-${ruleItem.id}`" :condition.sync="ruleItem.firstCondition" :type="ConditionItemType.FirstCondition" />
    <template v-if="isShowSecondCondition">
      <h6>and</h6>
      <ConditionItem :id="`second-condition-${ruleItem.id}`" :condition.sync="ruleItem.secondCondition" :type="ConditionItemType.SecondCondition" />
    </template>
    <template v-else>
      <h6 style="color: transparent">and</h6>
      <div style="width: 252px"></div>
    </template>
    <h6>then</h6>
    <template v-if="ruleValueType === RuleValueType.Color">
      <ColorPicker
        :id="`condition-color-picker-${ruleItem.id}`"
        :allowValueNull="true"
        :pickerType="PickerType.OnlyPreview"
        :value="ruleItem.value"
        class="then-value"
        defaultColor="#d2f4ff"
        @change="handleValueChanged"
      />
    </template>
    <template v-if="ruleValueType === RuleValueType.Icon">
      <IconPicker :value="ruleItem.value" class="then-value" @change="handleValueChanged" />
    </template>
    <i class="di-icon-delete icon-remove btn-icon-border" :disabled="!canRemove" @click="$emit('onRemove')"></i>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Rule, RuleType } from '@core/common/domain';
import ConditionItem, { ConditionItemType } from '@/shared/settings/common/conditional-formatting/ConditionItem.vue';
import ColorPicker, { PickerType } from '@/shared/components/ColorPicker.vue';
import { RulePickerType } from '@/shared/settings/common/conditional-formatting/FormattingOptions';
import IconPicker from '@/shared/settings/common/conditional-formatting/IconPicker.vue';

@Component({
  components: { ColorPicker, ConditionItem, IconPicker }
})
export default class RuleItem extends Vue {
  private readonly ConditionItemType = ConditionItemType;
  private readonly PickerType = PickerType;
  private readonly RuleValueType = RulePickerType;

  @Prop({ required: true })
  private readonly ruleItem!: Rule;

  @Prop({ required: true, type: Boolean })
  private readonly canRemove!: boolean;

  @Prop({ required: false, type: String, default: 'color' })
  private readonly ruleValueType!: RulePickerType;

  private get isShowSecondCondition(): boolean {
    const conditionType = this.ruleItem.firstCondition.conditionType;
    return conditionType === RuleType.GreaterThan || conditionType === RuleType.GreaterThanOrEqual;
  }

  private handleValueChanged(value: string): void {
    this.updateRuleItem({
      value: value
    } as Rule);
  }

  private updateRuleItem(newData: Rule): void {
    Object.assign(this.ruleItem, newData);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.rule-item {
  align-items: center;
  cursor: move;
  display: flex;
  height: 49px;
  justify-content: space-between;
  padding: 8px 12px;
  width: 100%;

  > h6 {
    margin: 0;
    opacity: 0.6;
  }

  > i {
    cursor: pointer;
    padding: 6px;
    font-size: 14px;
  }
}
</style>
