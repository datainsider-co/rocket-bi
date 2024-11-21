<template>
  <div class="dropdown-menu table-action-context-menu">
    <button @click="remove" type="button" class="dropdown-item">Remove</button>
  </div>
</template>
<script lang="ts">
import { Component } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import ContextMenuMinxin from '@/screens/data-cook/components/table-context-menu/ContextMenuMinxin';

@Component({
  components: {
    PopoverV2
  }
})
export default class ConnectionActionContextMenu extends ContextMenuMinxin {
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
