<template>
  <div>
    <div v-for="(condition, index) in conditions" :key="`${filterRequest.filterId}-${condition.label}-${index}`" class="filter-item">
      {{ name(condition) }}
      <span> {{ conditionDisplayName(condition) }}</span>
      {{ value(condition) }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { FilterRequest } from '@core/common/domain/request';
import { Condition, FieldRelatedCondition, NestedCondition, ValueCondition } from '@core/common/domain';
import { ListUtils } from '@/utils';

@Component
export default class FilterListingItem extends Vue {
  @Prop({ required: true, type: Object })
  filterRequest!: FilterRequest;

  private name(condition: FieldRelatedCondition): string {
    return condition.field.fieldName.replace('_', ' ');
  }

  private conditionDisplayName(condition: FieldRelatedCondition): string {
    return condition.className.replace('_', ' ').replace('-', ' ');
  }

  private value(condition: ValueCondition): string {
    const values = condition.getValues();
    const hasOnlyValue = values.length == 1;
    if (hasOnlyValue) {
      return values[0];
    } else {
      return values.join(', ');
    }
  }

  private get conditions(): ValueCondition[] {
    return this.getValueConditions([this.filterRequest.condition], []);
  }

  private getValueConditions(conditions: Condition[], result: ValueCondition[]): ValueCondition[] {
    if (ListUtils.isEmpty(conditions)) {
      return result;
    }
    const head = conditions[0];
    const rest = conditions.slice(1);
    if (NestedCondition.isNestedCondition(head)) {
      return this.getValueConditions(head.getConditions().concat(rest), result);
    } else if (FieldRelatedCondition.isFieldRelatedCondition(head) && ValueCondition.isValueCondition(head)) {
      result.push(head);
    }
    return this.getValueConditions(rest, result);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.filter-item {
  @include regular-text-14();
  margin: 0 12px 0 12px;
  text-transform: capitalize;

  span {
    opacity: 0.5;
    text-transform: none;
  }
}
</style>
