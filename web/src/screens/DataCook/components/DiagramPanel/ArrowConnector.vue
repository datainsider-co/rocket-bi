<template>
  <span></span>
</template>
<script lang="ts">
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import Konva from 'konva';
import { PRIMARY_COLOR } from '@/screens/DataCook/components/ManageEtlOperator/constance';
import { DiagramEvent, DiagramZIndex } from '@/screens/DataCook/components/DiagramPanel/DiagramEvent';
import { Log } from '@core/utils/Log';

const MIN_EDGE = 16;

@Component({})
export default class ArrowConnector extends Vue {
  protected arrow: Konva.Arrow | null = null;
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

  mounted() {
    this.onInitStage((stage: Konva.Stage, layer: Konva.Layer) => {
      this.stage = stage;
      this.layer = layer;

      this.arrow = this.draw(this.fromId, this.toId);

      this.stage.on(DiagramEvent.AddItem, this.handleAddItemEvent);
      this.stage.on(DiagramEvent.MoveItem, this.handleMoveItemEvent);
      this.stage.on(DiagramEvent.ChangeConnectorColor, this.handleChangeColorEvent);

      this.layer.add(this.arrow);
      this.arrow.zIndex(DiagramZIndex.Connector);
      this.layer.draw();

      this.updatePosition();
    });
  }

  destroyed() {
    if (this.arrow) {
      this.arrow.destroy();
    }
    if (this.stage) {
      this.stage.off(DiagramEvent.AddItem, this.handleAddItemEvent);
      this.stage.off(DiagramEvent.MoveItem, this.handleMoveItemEvent);
      this.stage.off(DiagramEvent.ChangeConnectorColor, this.handleChangeColorEvent);
    }
    if (this.layer) {
      this.layer.draw();
    }
  }

  protected handleAddItemEvent(e: any) {
    if ([this.fromId, this.toId].includes(e.id)) {
      this.updatePosition(true);
    }
  }

  protected handleMoveItemEvent(e: any) {
    if ([this.fromId, this.toId].includes(e.id)) {
      this.updatePosition(true);
    }
  }

  protected handleChangeColorEvent(e: any) {
    Log.info('handleChangeColorEvent', e);
    if (e.color && [this.fromId, this.toId].includes(e.id)) {
      this.arrow?.fill(e.color);
      this.arrow?.stroke(e.color);
      this.layer?.draw();
    }
  }

  protected updatePosition(drawLayer = false) {
    const lines = this.getLinePoints(this.fromId, this.toId);
    if (this.arrow && lines.length > 0) {
      this.arrow.points(lines);
      if (drawLayer && this.layer) {
        this.layer.draw();
      }
    }
  }

  protected getLinePoints(fromId: string, toId: string): number[] {
    const fromNode = this.layer?.findOne(`#${fromId}`);
    const toNode = this.layer?.findOne(`#${toId}`);
    const points: number[] = [];
    if (fromNode && toNode) {
      const x1 = fromNode.position().x + fromNode.width();
      const y1 = fromNode.position().y + fromNode.height() / 2;
      const x2 = toNode.position().x;
      const y2 = toNode.position().y + toNode.height() / 2;
      const delta = Math.max(MIN_EDGE, (x2 - x1) / 2);

      points.push(x1, y1);

      if (x2 < x1 + MIN_EDGE) {
        points.push(x1 + MIN_EDGE, y1);
        points.push(x1 + MIN_EDGE, y1 + (y2 - y1) / 2);
        points.push(x2 - delta, y1 + (y2 - y1) / 2);
      } else {
        points.push(x2 - delta, y1);
      }
      points.push(x2 - delta, y2);
      points.push(x2, y2);
    }
    return points;
  }

  protected draw(fromId: string, toId: string): Konva.Arrow {
    const arrow = new Konva.Arrow({
      stroke: PRIMARY_COLOR,
      strokeWidth: 1,
      fill: PRIMARY_COLOR,
      points: this.getLinePoints(fromId, toId),
      lineJoin: 'round'
    });
    return arrow;
  }
}
</script>
