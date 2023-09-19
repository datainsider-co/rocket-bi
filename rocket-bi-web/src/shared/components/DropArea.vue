<template>
  <div class="drop-area" :disabled="disabled">
    <div v-if="showTitle" class="d-flex flex-row header align-items-center">
      <div v-once class="title unselectable">{{ title }}</div>
      <div v-if="isOptional" v-once class="subtitle unselectable">(optional)</div>
    </div>
    <drop :class="{ active: isDragging && !disabled }" @drop="handleDrop" class="body">
      <slot name="drop-area"></slot>
    </drop>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import { Drop } from 'vue-drag-drop';
import { DataFlavor } from '@/shared';
import { Log } from '@core/utils';
import draggable from 'vuedraggable';

@Component({
  components: { Drop, draggable }
})
export default class DropArea extends Vue {
  @Prop({ type: String, required: false, default: '' })
  private title!: string;

  @Prop({ required: false, type: Boolean, default: true })
  private showTitle!: boolean;

  @Prop({ required: false, type: Boolean, default: true })
  private canDrop!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private isDragging!: boolean;

  @Prop({ type: Boolean, default: false })
  private isOptional!: boolean;

  @Prop({ type: Boolean, default: false })
  private disabled!: boolean;

  private handleDrop(data: DataFlavor<any>, event: MouseEvent): void {
    Log.debug('DropArea::handleDrop::');
    event.stopPropagation();
    if (this.canDrop && data && data.node) {
      this.$emit('onDrop', data);
    }
  }
}
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.drop-area {
  &[disabled] {
    pointer-events: none;
  }
  .header {
    .title {
      @include medium-text();
      font-weight: var(--builder-font-weight);
    }

    .subtitle {
      margin-left: 5px;
      color: var(--secondary-text-color);
    }
  }

  .body {
    //border: dashed 1.5px var(--grid-line-color);
    border: var(--config-draggable-border);
    background-color: var(--config-draggable-bg);
    border-radius: 4px;
    position: relative;

    ::v-deep {
      .tutorial-drop {
        font-size: 14px;

        @include regular-text();
        letter-spacing: 0.2px;
        padding: 16px;
      }
    }
  }

  .body.active {
    border: dashed 1.5px var(--accent);
  }

  .header + .body {
    margin-top: 16px;
  }
}
</style>

<style lang="scss">
.dark .tutorial-drop {
  opacity: 0.4;
}
</style>
