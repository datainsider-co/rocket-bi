<template>
  <div class="grid-stack-item" :style="{ zIndex: zIndex }" @mousedown="emitOnItemClicked" :id="`${id}-grid-stack-item`">
    <div class="grid-stack-item-content">
      <slot :remove="remove"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Prop, Provide, Vue } from 'vue-property-decorator';
import { GridStackElement, GridStackNode, GridStackWidget } from 'gridstack';
import { Position, WidgetId } from '@core/common/domain';
import { Log } from '@core/utils';

@Component
export default class DiGridstackItem extends Vue {
  @Prop({ required: true, type: Number, default: -1 })
  id!: number;

  @Prop({ required: true, type: Number })
  x!: number;

  @Prop({ required: true, type: Number })
  y!: number;

  @Prop({ required: true, type: Number })
  width!: number;

  @Prop({ required: true, type: Number })
  height!: number;

  @Prop({ required: true, type: Number, default: 1 })
  zIndex!: number;

  @Inject()
  addItem!: (el: GridStackElement, options?: GridStackWidget) => void;

  @Inject()
  removeItem!: (els: GridStackElement, removeDOM?: boolean, triggerEvent?: boolean) => void;

  mounted() {
    // @ts-ignored
    this.$el.$gsChange = this.onChange;
    const x = this.x < 0 ? void 0 : this.x;
    const y = this.y < 0 ? void 0 : this.y;
    const data: GridStackWidget = {
      x: x,
      y: y,
      height: this.height,
      width: this.width,
      id: this.id
    };
    this.addItem(this.$el as HTMLElement, data);
  }

  @Emit('change')
  onChange(e: GridStackNode) {
    return {
      id: this.id,
      position: {
        column: e.x,
        row: e.y,
        height: e.height,
        width: e.width,
        zIndex: this.zIndex
      }
    };
  }

  @Provide()
  remove(callback: Function) {
    this.removeItem(this.$el as HTMLElement);
    if (typeof callback === 'function') callback();
  }

  @Emit('onClick')
  emitOnItemClicked(event: Event) {
    return event;
  }
}
</script>
