<template>
  <div class="dropdown-menu table-action-context-menu">
    <button @click="toggle" type="button" class="dropdown-item">
      {{ toggleText }}
    </button>
    <button v-if="isShowRemoveOption" @click="remove" type="button" class="dropdown-item">Remove</button>
  </div>
</template>
<script lang="ts">
import { Component } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import ContextMenuMixin from '@/screens/DataCook/components/TableContextMenu/ContextMenu.mixin';
import { TableSchema } from '@core/domain';

@Component({
  components: {
    PopoverV2
  }
})
export default class TableActionContextMenu extends ContextMenuMixin {
  private isExpanded = false;
  private isShowRemoveOption = false;
  private tableSchema: TableSchema | null = null;

  private get toggleText(): string {
    return this.isExpanded ? 'Collapse' : 'Expand';
  }

  public showPopover(tableSchema: TableSchema, isExpanded: boolean, isEditMode: boolean, top: number, left: number) {
    this.tableSchema = tableSchema;
    this.isExpanded = isExpanded;
    this.isShowRemoveOption = isEditMode;
    this.show(top, left);
  }

  public hidePopover() {
    this.hide();
  }

  private toggle() {
    if (this.isExpanded) {
      this.$emit('hide', this.tableSchema);
    } else {
      this.$emit('expand', this.tableSchema);
    }
    this.hidePopover();
  }

  private remove() {
    this.$emit('remove', this.tableSchema);
    this.hidePopover();
  }
}
</script>
<style lang="scss" scoped>
.table-action-context-menu {
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
