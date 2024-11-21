<template>
  <span></span>
</template>
<script lang="ts">
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import Konva from 'konva';
import { ACCENT_COLOR } from '@/screens/data-cook/components/manage-etl-operator/Constance';
import { DiagramEvent, DiagramZIndex } from '@/screens/data-cook/components/diagram-panel/DiagramEvent';
import { Log } from '@core/utils/Log';
import Context = Konva.Context;
import Shape = Konva.Shape;

@Component({})
export default class CurvedConnector extends Vue {
  protected line: Konva.Shape | null = null;
  protected stage: Konva.Stage | null = null;
  protected layer: Konva.Layer | null = null;

  @Inject('onInitStage')
  protected readonly onInitStage!: Function;

  @Prop({ type: String, required: true })
  readonly fromId!: string;

  @Prop({ type: String, required: true })
  readonly toId!: string;

  @Prop({ type: Boolean, required: false, default: false })
  protected readonly isToPointer!: boolean;

  @Prop({ type: Boolean })
  protected readonly draggable!: boolean;

  mounted() {
    this.onInitStage((stage: Konva.Stage, layer: Konva.Layer) => {
      Log.debug('Connector::mounted::');
      this.stage = stage;
      this.layer = layer;

      this.line = this.draw(this.fromId, this.toId);
      this.addLineEvent(this.line!);

      this.stage.on(DiagramEvent.AddItem, this.handleAddItemEvent);
      this.stage.on(DiagramEvent.MoveItem, this.handleMoveItemEvent);

      this.layer.add(this.line!);
      // this.layer.add(group)
      this.line!.zIndex(DiagramZIndex.Connector);
      this.layer.draw();

      this.updatePosition();
    });
  }

  private addLineEvent(line: Konva.Shape) {
    line!.on('mouseover', ev => {
      if (this.stage) {
        this.stage.container().style.cursor = 'pointer';
      }
    });

    line!.on('mouseleave', ev => {
      if (this.stage) {
        this.stage.container().style.cursor = 'grab';
      }
    });
    line.on('click', ev => {
      this.$emit('showAction', this.fromId, this.toId, ev);
    });
  }

  removeConnector() {
    this.line?.destroy();
    this.layer?.draw();
  }

  redraw() {
    if (this.line && this.layer && this.stage) {
      this.line.destroy();
      this.line = this.draw(this.fromId, this.toId);
      this.addLineEvent(this.line);
      this.layer.add(this.line);
      this.layer.draw();
    }
  }

  destroyed() {
    if (this.line) {
      this.line.destroy();
    }
    if (this.stage) {
      this.stage.off(DiagramEvent.AddItem, this.handleAddItemEvent);
      this.stage.off(DiagramEvent.MoveItem, this.handleMoveItemEvent);
    }
    if (this.layer) {
      this.layer.draw();
    }
  }

  protected handleAddItemEvent(e: any) {
    Log.debug('CurvedConnector::handleAddItemEvent::', e.id, this.fromId, this.toId);
    if (this.fromId.includes(e.id) || this.toId.includes(e.id)) {
      this.updatePosition(true);
    }
  }

  protected handleMoveItemEvent(e: any) {
    Log.debug('CurvedConnector::handleMoveItemEvent::e::', e);
    if (this.fromId.includes(e.id) || this.toId.includes(e.id)) {
      this.updatePosition(true);
    }
  }

  updatePosition(drawLayer = false) {
    const lines = this.isToPointer ? this.getPointerLinePoints(this.fromId) : this.getLinePoints(this.fromId, this.toId);
    if (this.line && lines.length > 0) {
      //todo: update here
      this.line.sceneFunc(this.updateSceneFunc(lines));
      if (drawLayer && this.layer) {
        this.layer.draw();
      }
    }
  }

  private getPointerLinePoints(fromId: string): number[] {
    const fromNode = this.layer?.findOne(`#${fromId}`);
    const points: number[] = [];
    if (fromNode) {
      const tableWidth = fromNode.width();
      const fromParentNode = fromNode.parent;
      const fromParentNodeX = fromParentNode?.position().x ?? 0;
      const fromParentNodeY = fromParentNode?.position().y ?? 0;

      const x1 = fromParentNodeX + fromNode.position().x + fromNode.width() / 2;
      const y1 = fromParentNodeY + fromNode.position().y + fromNode.height() / 2;
      const pointerPos = this.stage?.getPointerPosition();
      const oldScale = this.stage?.scaleX();
      if (pointerPos && oldScale) {
        const x2 = (pointerPos.x - this.stage!.x()) / oldScale;
        const y2 = (pointerPos.y - this.stage!.y()) / oldScale;
        if (x1 >= x2 && x1 - x2 >= 0 && x1 - x2 < (3 / 2) * tableWidth) {
          points.push(x1 - tableWidth / 2, y1);
          points.push(x2 - tableWidth, (y2 + y1) / 2);
          points.push(x2, y2);
          points.push(x2, y2);
        } else if (x1 >= x2) {
          points.push(x1 - tableWidth / 2, y1);
          points.push((x1 + x2) / 2, y1);
          points.push((x1 + x2) / 2, y2);
          points.push(x2, y2);
        } else if (x2 >= x1 && x2 - x1 >= 0 && x2 - x1 < (3 / 2) * tableWidth) {
          points.push(x1 + tableWidth / 2, y1);
          points.push(x2 + tableWidth, (y2 + y1) / 2);
          points.push(x2, y2);
          points.push(x2, y2);
        } else {
          points.push(x1 + tableWidth / 2, y1);

          points.push((x1 + x2) / 2, y1);
          points.push((x1 + x2) / 2, y2);
          points.push(x2, y2);
        }
      }
    }
    return points;
  }

  protected getLinePoints(fromId: string, toId: string): number[] {
    const fromNode = this.layer?.findOne(`#${fromId}`);
    const toNode = this.layer?.findOne(`#${toId}`);
    const points: number[] = [];
    if (fromNode && toNode) {
      const tableWidth = 209;
      const fromParentNode = fromNode.parent;
      const toParentNode = toNode.parent;
      const fromParentNodeX = fromParentNode?.position().x ?? 0;
      const fromParentNodeY = fromParentNode?.position().y ?? 0;

      const toParentNodeX = toParentNode?.position().x ?? 0;
      const toParentNodeY = toParentNode?.position().y ?? 0;
      const x1 = fromParentNodeX + fromNode.position().x + fromNode.width() / 2;
      const y1 = fromParentNodeY + fromNode.position().y + fromNode.height() / 2;
      const x2 = toParentNodeX + toNode.position().x + fromNode.width() / 2;
      const y2 = toParentNodeY + toNode.position().y + toNode.height() / 2;

      if (x1 >= x2 && x1 - x2 >= 0 && x1 - x2 < (3 / 2) * tableWidth) {
        points.push(x1 - tableWidth / 2, y1);
        points.push(x2 - tableWidth, (y2 + y1) / 2);
        points.push(x2 - tableWidth / 2, y2);
        points.push(x2 - tableWidth / 2, y2);
      } else if (x1 >= x2) {
        points.push(x1 - tableWidth / 2, y1);
        points.push((x1 + x2) / 2, y1);
        points.push((x1 + x2) / 2, y2);
        points.push(x2 + tableWidth / 2, y2);
      } else if (x2 >= x1 && x2 - x1 >= 0 && x2 - x1 < (3 / 2) * tableWidth) {
        points.push(x1 + tableWidth / 2, y1);
        points.push(x2 + tableWidth, (y2 + y1) / 2);
        points.push(x2 + tableWidth / 2, y2);
        points.push(x2 + tableWidth / 2, y2);
      } else {
        points.push(x1 + tableWidth / 2, y1);

        points.push((x1 + x2) / 2, y1);
        points.push((x1 + x2) / 2, y2);
        points.push(x2 - tableWidth / 2, y2);
      }
    }
    Log.debug('CurvedConnector::getLinePoints::point::', this.fromId, this.toId, points);
    return points;
  }

  private updateSceneFunc(points: number[]) {
    return (ctx: Context, shape: Shape) => {
      ctx.beginPath();
      ctx.moveTo(points[0], points[1]);
      ctx.bezierCurveTo(points[2], points[3], points[4], points[5], points[6], points[7]);
      ctx.fillStrokeShape(shape);
    };
  }
  protected draw(fromId: string, toId: string) {
    const points = this.isToPointer ? this.getPointerLinePoints(fromId) : this.getLinePoints(fromId, toId);
    const line = new Konva.Shape({
      stroke: ACCENT_COLOR,
      strokeWidth: 2,
      sceneFunc: this.updateSceneFunc(points),
      hitStrokeWidth: 10
    });
    return line;
  }
}
</script>
