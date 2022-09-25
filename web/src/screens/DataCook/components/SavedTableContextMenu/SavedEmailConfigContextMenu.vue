<template>
  <div class="dropdown-menu operator-context-menu">
    <button @click="edit" type="button" class="dropdown-item">
      <div class="d-flex align-items-center">
        Edit
        <i v-if="isLoadingPreview" class="fa fa-spin fa-spinner ml-auto"></i>
      </div>
    </button>
    <button @click="remove" type="button" class="dropdown-item">Remove</button>
  </div>
</template>
<script lang="ts">
import { Component, Inject } from 'vue-property-decorator';
import { EtlOperator } from '@core/DataCook';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import ContextMenuMixin from '../TableContextMenu/ContextMenu.mixin';

@Component({
  components: {
    PopoverV2
  }
})
export default class SavedEmailConfigContextMenu extends ContextMenuMixin {
  private operator: EtlOperator | null = null;

  @Inject('isLoadingOperator')
  private readonly isLoadingOperatorInjector!: (operator: EtlOperator) => boolean;

  private get isLoadingPreview() {
    if (this.isLoadingOperatorInjector && this.operator) {
      return this.isLoadingOperatorInjector(this.operator);
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

  private remove() {
    this.$emit('remove', this.operator);
    this.hidePopover();
  }

  private edit() {
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
