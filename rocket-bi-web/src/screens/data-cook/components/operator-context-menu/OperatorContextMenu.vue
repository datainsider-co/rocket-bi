<template>
  <div class="dropdown-menu operator-context-menu">
    <button @click="editOperator" type="button" class="dropdown-item" :class="{ disabled: isLoadingPreview }">
      <div class="d-flex align-items-center">
        Edit
        <i v-if="isLoadingPreview" class="fa fa-spin fa-spinner ml-auto"></i>
      </div>
    </button>
    <button @click="removeOperator" type="button" class="dropdown-item">Remove</button>
  </div>
</template>
<script lang="ts">
import { Component, Inject, Vue } from 'vue-property-decorator';
import { ETLOperatorType, EtlOperator, JoinOperator, ManageFieldOperator, PivotTableOperator, SQLQueryOperator, TransformOperator } from '@core/data-cook';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import ContextMenuMinxin from '../table-context-menu/ContextMenuMinxin';

@Component({
  components: {
    PopoverV2
  }
})
export default class OperatorContextMenu extends ContextMenuMinxin {
  private operator: EtlOperator | null = null;

  @Inject('isLoadingOperator')
  private readonly isLoadingOperatorInjector!: (operator: EtlOperator) => boolean;

  private get isLoadingPreview() {
    if (this.isLoadingOperatorInjector && this.operator) {
      switch (this.operator.className) {
        case ETLOperatorType.JoinOperator:
          return (
            this.isLoadingOperatorInjector((this.operator as JoinOperator).joinConfigs[0].leftOperator) ||
            this.isLoadingOperatorInjector((this.operator as JoinOperator).joinConfigs[0].rightOperator)
          );
        case ETLOperatorType.TransformOperator:
          return this.isLoadingOperatorInjector((this.operator as TransformOperator).operator);
        case ETLOperatorType.ManageFieldOperator:
          return this.isLoadingOperatorInjector((this.operator as ManageFieldOperator).operator);
        case ETLOperatorType.PivotTableOperator:
          return this.isLoadingOperatorInjector((this.operator as PivotTableOperator).operator);
        case ETLOperatorType.SQLQueryOperator:
          return this.isLoadingOperatorInjector((this.operator as SQLQueryOperator).operator);
        case ETLOperatorType.GetDataOperator:
        default:
          return this.isLoadingOperatorInjector(this.operator);
      }
    }
    return true;
  }

  public showPopover(operator: EtlOperator, top: number, left: number) {
    this.operator = operator;
    this.show(top, left);
  }

  public hidePopover() {
    this.hide();
  }

  private removeOperator() {
    this.$emit('remove', this.operator);
    this.hidePopover();
  }

  private editOperator() {
    if (this.isLoadingPreview) return;
    this.$emit('edit', this.operator);
    this.hidePopover();
  }
}
</script>
<style lang="scss" scoped>
.operator-context-menu {
  position: fixed !important;
  overflow: hidden;

  .dropdown-item.disabled {
    pointer-events: unset;
    & > * {
      opacity: 0.6;
    }
    cursor: not-allowed !important;
  }
}
</style>
