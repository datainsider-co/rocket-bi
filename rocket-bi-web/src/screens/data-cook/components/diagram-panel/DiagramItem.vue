<template>
  <span></span>
</template>
<script lang="ts">
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import Konva from 'konva';
import { Log } from '@core/utils';
import { DiagramEvent } from '@/screens/data-cook/components/diagram-panel/DiagramEvent';

@Component({})
export default class DiagramItem extends Vue {
  protected stage: Konva.Stage | null = null;
  protected group: Konva.Group | null = null;
  protected layer: Konva.Layer | null = null;

  @Inject('onInitStage')
  protected readonly onInitStage!: Function;

  @Prop({ type: String, required: true })
  protected readonly id!: string;

  // @Prop({ type: Number })
  // protected readonly x!: number;
  //
  // @Prop({ type: Number })
  // protected readonly y!: number;

  @Prop({ type: Boolean })
  protected readonly draggable!: boolean;

  mounted() {
    this.onInitStage(async (stage: Konva.Stage, layer: Konva.Layer) => {
      this.stage = stage;
      this.layer = layer;
      let group: Konva.Group | null = this.draw();
      if (!group) {
        group = await this.drawAsync();
      }
      this.group = group ?? this.drawNotImplementYet();
      this.group.on('dragmove', this.onDragMove);

      this.layer.add(this.group);
      this.layer.draw();

      this.stage.fire(DiagramEvent.AddItem, { id: this.id });
    });
  }

  protected async redraw() {
    if (this.group && this.layer && this.stage) {
      this.group.destroy();
      let group: Konva.Group | null = this.draw();
      if (!group) {
        group = await this.drawAsync();
      }
      this.group = group ?? this.drawNotImplementYet();

      // this.group.on('dragmove', this.onDragMove);

      this.layer.add(this.group);
      this.layer.draw();

      this.stage.fire(DiagramEvent.AddItem, { id: this.id });
      Log.debug('DiagramItem::redraw::addItem::', this.id);
    }
  }

  destroyed() {
    Log.info('Destroyed Diagram Item', this.group);
    if (this.group) {
      this.group.off('dragmove', this.onDragMove);
      this.group.destroy();
    }
    if (this.layer) {
      this.layer.draw();
    }
  }

  protected onDragMove() {
    Log.debug('DiagramItem::onDragMove::');
    // if (this.group && this.group.x() < 0) {
    //   this.group.x(0);
    // }
    // if (this.group && this.group.y() < 0) {
    //   this.group.y(0);
    // }
    if (this.stage) {
      this.stage.fire(DiagramEvent.MoveItem, { id: this.id });
    }
  }

  protected draw(): Konva.Group | null {
    return null;
  }

  protected async drawAsync(): Promise<Konva.Group | null> {
    return null;
  }

  private drawNotImplementYet(): Konva.Group {
    const group = new Konva.Group({
      id: this.id,
      draggable: this.draggable,
      x: 20,
      y: 20,
      width: 130,
      height: 50
    });

    const rect = new Konva.Rect({
      stroke: '#555',
      strokeWidth: 2,
      fill: '#ddd',
      width: group.width(),
      height: group.height(),
      cornerRadius: 6
    });

    const txtMessage = new Konva.Text({
      width: group.width(),
      height: 30,
      verticalAlign: 'middle',
      align: 'center',
      text: 'not implement draw',
      fill: 'red'
    });
    const txtId = new Konva.Text({
      y: 30,
      width: group.width(),
      height: 12,
      align: 'center',
      text: `ID: ${this.id || '<<empty>>'}`,
      fontSize: 10,
      fill: '#333',
      wrap: 'none'
    });
    group.add(rect);
    group.add(txtId);
    group.add(txtMessage);
    return group;
  }
}
</script>
