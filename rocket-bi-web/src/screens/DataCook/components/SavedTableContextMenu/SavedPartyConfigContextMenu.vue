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
import { ThirdPartyPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/ThirdPartyPersistConfiguration';

@Component({
  components: {
    PopoverV2
  }
})
export default class SavedPartyConfigContextMenu extends ContextMenuMixin {
  private thirdPartyConfig: ThirdPartyPersistConfiguration | null = null;
  private operator: EtlOperator | null = null;
  private thirdPartyConfigIndex = -1;

  @Inject('isLoadingOperator')
  private readonly isLoadingOperatorInjector!: (thirdPartyConfig: ThirdPartyPersistConfiguration) => boolean;

  private get isLoadingPreview() {
    if (this.isLoadingOperatorInjector && this.thirdPartyConfig) {
      return this.isLoadingOperatorInjector(this.thirdPartyConfig);
    }
    return true;
  }

  public showPopover(operator: EtlOperator, thirdPartyConfig: ThirdPartyPersistConfiguration, thirdPartyConfigIndex: number, top: number, left: number) {
    this.operator = operator;
    this.thirdPartyConfig = thirdPartyConfig;
    this.thirdPartyConfigIndex = thirdPartyConfigIndex;
    this.show(top, left);
  }

  public hidePopover() {
    this.hide();
  }

  private remove() {
    this.$emit('remove', this.operator, this.thirdPartyConfigIndex);
    this.hidePopover();
  }

  private edit() {
    this.$emit('edit', this.operator, this.thirdPartyConfigIndex);
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
