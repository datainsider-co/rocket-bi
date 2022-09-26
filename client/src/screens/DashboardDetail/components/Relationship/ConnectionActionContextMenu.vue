<template>
  <div class="dropdown-menu table-action-context-menu">
    <button @click="remove" type="button" class="dropdown-item">Remove</button>
  </div>
</template>
<script lang="ts">
import { Component } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import ContextMenuMixin from '@/screens/DataCook/components/TableContextMenu/ContextMenu.mixin';

@Component({
  components: {
    PopoverV2
  }
})
export default class ConnectionActionContextMenu extends ContextMenuMixin {
  private fromId: string | null = null;
  private toId: string | null = null;
  public showPopover(fromId: string, toId: string, top: number, left: number) {
    this.fromId = fromId;
    this.toId = toId;
    this.show(top, left);
  }

  public hidePopover() {
    this.hide();
  }

  private remove() {
    this.$emit('remove', this.fromId, this.toId);
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
