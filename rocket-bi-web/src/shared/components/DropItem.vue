<template>
  <div class="d-flex flex-column" ref="item">
    <Drop class="divider" @dragenter="handleDragenterDivider" @dragleave="handleDragExitDivider" @drop="handleInsertItem">
      <div :class="{ active: isDividerActive }"></div>
    </Drop>
    <Drop
      class="items"
      ref="item"
      v-b-hover="handleHoverItem"
      @mousedown="onMouseDown"
      @dragenter="handleDragenterItem"
      @dragleave="handleDragExitItem"
      @drop="handleOnDrop"
    >
      <slot :opacity="opacity"></slot>
    </Drop>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DataFlavor } from '@/shared';
import { Drop } from 'vue-drag-drop';
import { Log } from '@core/utils';
import { DynamicConditionWidget } from '@core/common/domain';

@Component({
  components: {
    Drop
  }
})
export default class DropItem extends Vue {
  @Prop({ default: false })
  private isItemDragging!: boolean;

  @Prop({ required: true, type: Number })
  private index!: number;

  @Prop({ type: Boolean, default: true })
  private canInsert!: boolean;

  @Prop({ type: Boolean, default: true })
  private canReplace!: boolean;

  @Ref()
  private item!: HTMLElement;

  private isHovered = false;
  private lock = false;
  private isDragEnterDivider = false;
  private counterDragEnterItem = 0;

  private handleHoverItem(isHovered: boolean) {
    this.isHovered = isHovered;
    if (!this.isItemDragging) {
      this.item.classList.toggle('btn-ghost', isHovered);
      this.item.classList.toggle('sortable-chosen', isHovered);
    }
  }

  private onMouseDown(event: MouseEvent) {
    this.lock = true;
  }

  @Watch('isItemDragging')
  private onItemDragging(newValue: boolean) {
    if (!newValue) {
      // TODO: be careful when change logic below
      if (this.lock) {
        this.lock = false;
        this.isHovered = true;
      } else {
        this.isHovered = false;
      }
      this.item.classList.toggle('sortable-chosen', this.isHovered);
    }
  }

  private get canShowEdit() {
    return this.isHovered && !this.isItemDragging;
  }

  private get opacity() {
    return this.canShowEdit ? 0.8 : 0;
  }

  private get isDividerActive() {
    return !this.isItemDragging && this.isDragEnterDivider && this.canInsert;
  }

  private handleDragenterItem() {
    this.counterDragEnterItem++;
    if (!this.isItemDragging) {
      this.handleHoverItem(true);
    }
  }

  private handleDragExitItem() {
    this.counterDragEnterItem--;
    if (!this.isItemDragging && this.counterDragEnterItem === 0) {
      this.handleHoverItem(false);
    }
  }

  private handleDragenterDivider() {
    this.isDragEnterDivider = true;
  }

  private handleDragExitDivider() {
    this.isDragEnterDivider = false;
  }

  private handleOnDrop(data: DataFlavor<any>, event: Event): void {
    if (this.canReplace) {
      this.handleReplace(data, event);
    } else if (this.canInsert) {
      this.handleInsert(data, event);
    }
  }

  private handleReplace(data: DataFlavor<any>, event: Event) {
    this.handleDragExitItem();
    event.stopPropagation();
    if (data) {
      const isDynamicControl = !!data?.node?.tag?.values;
      const eventName = isDynamicControl ? 'onReplaceDynamic' : 'onReplace';
      this.$emit(eventName, [data.node, this.index]);
    }
  }

  private handleInsert(data: DataFlavor<any>, event: Event) {
    this.handleDragExitItem();
    event.stopPropagation();
    if (data) {
      const isDynamicControl = !!data?.node?.tag?.values;
      const eventName = isDynamicControl ? 'onInsertDynamic' : 'onInsert';
      this.$emit(eventName, [data.node, this.index]);
    }
  }

  private handleInsertItem(data: DataFlavor<any>, event: Event): void {
    this.handleDragExitDivider();
    event.stopPropagation();
    if (this.canInsert && data) {
      this.$emit('onInsert', [data.node, this.index]);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.divider {
  position: sticky;
  padding: 8px 0;
  margin: -8px 8px;
  box-sizing: border-box;
  //background-color: red;
  background-color: transparent;

  > div {
    height: 2px;

    &.active {
      background-color: var(--accent);
      border-radius: 4px;
    }
  }
}

.sortable-chosen {
  background-color: var(--hover-color);
  cursor: pointer;

  &:hover {
    cursor: pointer;
  }

  &:active {
    background-color: var(--active-color);
    cursor: grabbing;
  }
}

.items {
  padding: 8px;
  display: flex;
}
</style>
