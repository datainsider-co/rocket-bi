<template>
  <span></span>
</template>
<script lang="ts">
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import Konva from 'konva';
type TOptions = { offsetYFrom?: number; offsetYTo?: number; height?: number };

@Component({})
export default class EventConnection extends Vue {
  protected shape: Konva.Shape | null = null;
  protected group: Konva.Group | null = null;
  protected stage: Konva.Stage | null = null;
  protected layer: Konva.Layer | null = null;

  @Inject('onInitStage')
  protected readonly onInitStage!: Function;

  @Prop({ type: String, required: true })
  protected readonly fromId!: string;

  @Prop({ type: String, required: true })
  protected readonly toId!: string;

  @Prop({ type: Boolean })
  protected readonly draggable!: boolean;

  @Prop({ type: Object, default: () => null })
  protected readonly options!: TOptions | null;

  mounted() {
    this.onInitStage((stage: Konva.Stage, layer: Konva.Layer) => {
      this.$nextTick(() => {
        this.stage = stage;
        this.layer = layer;
        this.group = this.draw(this.fromId, this.toId);
        this.layer.add(this.group);
        this.layer.draw();
      });
    });
  }

  destroyed() {
    if (this.group) {
      this.group.destroy();
    }
    if (this.layer) {
      this.layer.draw();
    }
  }

  protected draw(fromId: string, toId: string): Konva.Group {
    const fromRect = document.getElementById(fromId)?.getBoundingClientRect();
    const toRect = document.getElementById(toId)?.getBoundingClientRect();
    const parentRect = this.stage?.getContent().parentElement?.getBoundingClientRect();

    const group =
      this.group ||
      new Konva.Group({
        x: 0,
        y: 0
      });

    if (fromRect && toRect && parentRect) {
      // const height = toRect.height;
      const height = this.options?.height || Math.min(fromRect.height, toRect.height);
      const width = fromRect.width;
      const fromXPosition = fromRect.x - parentRect.x + width;
      const fromYPosition = fromRect.y - parentRect.y + (this.options?.offsetYFrom || 0);
      const toXPosition = toRect.x - parentRect.x;
      const toYPosition = toRect.y - parentRect.y + (this.options?.offsetYTo || 0);

      const toX = toXPosition - fromXPosition;
      const toY = toYPosition - fromYPosition;
      const shape = new Konva.Shape({
        sceneFunc: function(context, shape) {
          context.beginPath();
          const DELTA = 40;
          context.moveTo(0, 0);
          context.quadraticCurveTo(DELTA, 0, toX / 2, toY / 2);
          context.lineTo(toX / 2, toY / 2);
          context.quadraticCurveTo(toX - DELTA, toY, toX, toY);
          context.lineTo(toX, toY);
          context.lineTo(toX, toY + height);
          context.quadraticCurveTo(toX - DELTA, toY + height, toX / 2, toY / 2 + height);
          context.lineTo(toX / 2, toY / 2 + height);
          context.quadraticCurveTo(DELTA, height, 0, height);
          context.lineTo(0, height);
          context.closePath();
          context.fillShape(shape);
        },
        fill: '#597fff1a'
      });

      group.setPosition({
        x: fromXPosition,
        y: fromYPosition
      });
      if (this.shape) {
        this.shape.destroy();
      }
      this.shape = shape;
      group.add(this.shape);
      this.layer?.draw();
    }
    return group;
  }

  reDraw() {
    this.draw(this.fromId, this.toId);
  }
}
</script>
