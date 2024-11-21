<template>
  <div class="rules-panel">
    <div class="rules-header">
      <h5>Rules use</h5>
      <DiButton id="btn-add-rule" title="Add rules" @click="addNewRule">
        <img alt="add-icon" src="@/assets/icon/ic_add.svg" />
      </DiButton>
    </div>
    <draggable v-model="clonedRules" v-bind="dragOptions" class="rules-body" @choose="handlePrepareDrag">
      <template v-for="(rule, index) in clonedRules">
        <RuleItem :key="rule.id" :canRemove="clonedRules.length > 1" :ruleValueType="ruleValueType" :ruleItem.sync="rule" @onRemove="removeRule(index)" />
      </template>
    </draggable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import draggable from 'vuedraggable';
import { Rule, RuleType, ValueType } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import { ListUtils, RandomUtils } from '@/utils';
import RuleItem from '@/shared/settings/common/conditional-formatting/RuleItem.vue';
import { RuleUtils } from '@/shared/settings/common/conditional-formatting/RuleUtils';
import { PopupUtils } from '@/utils/PopupUtils';
import { RulePickerType } from '@/shared/settings/common/conditional-formatting/FormattingOptions';

@Component({
  components: { RuleItem, DiButton, draggable }
})
export default class RulePanel extends Vue {
  private clonedRules: Rule[] = [];

  @Prop({ required: true, type: Array, default: [] })
  private readonly rules!: Rule[];

  @Prop({ required: false, type: String, default: 'color' })
  private readonly ruleValueType!: RulePickerType;

  private get dragOptions() {
    return {
      animation: 100,
      ghostClass: 'ghost',
      emptyInsertThreshold: 100,
      filter: '.rule-condition, .then-value, .icon-remove',
      preventOnFilter: false,
      dragClass: 'rule-drag-class',
      group: {
        name: 'rule-panel',
        put: true,
        // ability to move from the list, clone/move/ or none
        pull: ['rule-panel']
      }
    };
  }

  mounted() {
    this.clonedRules = cloneDeep(this.rules);
    if (ListUtils.isEmpty(this.clonedRules)) {
      this.addNewRule();
    }
  }

  addNewRule() {
    const rule: Rule = this.createNewRule();
    this.clonedRules.push(rule);
  }

  setRules(rules: Rule[]) {
    this.clonedRules = cloneDeep(rules);
  }

  removeRule(index: number) {
    this.clonedRules.splice(index, 1);
  }

  validate(): boolean {
    const ruleInValid = this.clonedRules.find(rule => !RuleUtils.validate(rule));
    return !ruleInValid;
  }

  getRules(): Rule[] {
    return cloneDeep(this.clonedRules);
  }

  private createNewRule(): Rule {
    return {
      id: RandomUtils.nextString(),
      firstCondition: {
        conditionType: RuleType.GreaterThanOrEqual,
        value: '0',
        valueType: ValueType.Number
      },
      secondCondition: {
        conditionType: RuleType.LessThan,
        value: '0',
        valueType: ValueType.Number
      },
      value: this.getDefaultValue()
    };
  }

  private getDefaultValue() {
    switch (this.ruleValueType) {
      case RulePickerType.Icon:
        return '🔴';
      default:
        return '#d2f4ff';
    }
  }

  private handlePrepareDrag() {
    PopupUtils.hideAllPopup();
  }
}
</script>

<style lang="scss">
div.rules-panel {
  > div.rules-header {
    align-items: center;
    display: flex;
    justify-content: space-between;

    > h5 {
      font-size: 14px;
      margin: 0;
    }

    #btn-add-rule {
      padding: 4px;
    }
  }

  > div.rules-body {
    background: var(--active-color);
    height: 100%;
    min-height: 48px;

    .ghost {
      background: var(--hover-color);
      opacity: 0.6;
    }

    .rule-drag-class {
      background: var(--active-color);
      margin: 0;
    }
  }

  > div + div {
    margin-top: 12px;
  }
}
</style>
