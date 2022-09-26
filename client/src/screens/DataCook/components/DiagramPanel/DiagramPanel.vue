<template>
  <div class="diagram-panel" :class="{ 'diagram-fullscreen': isFullscreen }">
    <div ref="body" :id="id" class="diagram-panel-body" :class="{ 'no-control': noControl }">
      <LoadingComponent v-if="!stage" class="w-100"></LoadingComponent>
    </div>
    <div v-if="!noControl" class="diagram-controls">
      <button :disabled="!stage" @click.prevent="zoomOut" class="btn btn-secondary mr-2">-</button>
      <button :disabled="!stage" @click.prevent="resetZoom" class="btn btn-secondary mr-2">{{ zoomPercent | percent }}</button>
      <button :disabled="!stage" @click.prevent="zoomIn" class="btn btn-secondary mr-2">+</button>
      <button :disabled="!stage" @click.prevent="fitContent" class="btn btn-secondary mr-2">Fit content</button>
      <button :disabled="!stage" @click.prevent="toggleFullscreen" class="btn btn-secondary mr-2">
        <template v-if="isFullscreen">Exit full screen</template>
        <template v-else>Full screen</template>
      </button>
      <slot name="controls"></slot>
    </div>
    <div class="diagram-ghost">
      <slot></slot>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Provide, Ref, Vue } from 'vue-property-decorator';
import Konva from 'konva';
import { Log } from '@core/utils';
import { PositionValue } from '@core/DataCook';
import { KonvaEventObject } from 'konva/types/Node';
import DiagramItem from './DiagramItem.vue';

const MIN_ZOOM = 10;
const FIT_CONTENT_OFFSET = 20;
const ZOOM_SCALE_RATIO = 1.02;

@Component({
  filters: {
    percent(percent: number) {
      return `${Math.ceil(percent)}%`;
    }
  }
})
export default class DiagramPanel extends Vue {
  private id = [new Date().getTime(), Math.floor(Math.random() * 1000)].map(i => i.toString(36)).join('');
  private stage: Konva.Stage | null = null;
  private zoomPercent = 100;
  private zoomDelta = 20;
  private mainLayer: Konva.Layer | null = null;
  private tween!: Konva.Tween | null;
  private onInitStageCallbacks: Function[] = [];
  private isFullscreen = false;

  @Prop({ type: Boolean })
  private noZoom!: boolean;

  @Prop({ type: Boolean })
  private noScroll!: boolean;

  @Prop({ type: Boolean })
  private noControl!: boolean;

  @Prop({ type: Boolean })
  private noDraggable!: boolean;

  @Ref('body')
  private bodyEl!: HTMLElement;

  @Prop({ type: Object, default: () => null })
  private readonly position?: PositionValue;

  @Provide('onInitStage')
  private onInitStage(callback: Function) {
    if (this.stage) {
      callback(this.stage, this.mainLayer);
    } else {
      this.onInitStageCallbacks.push(callback);
    }
  }

  mounted() {
    this.init();
    window.document.body.addEventListener('fullscreenchange', this.onFullscreenChange);
    window.addEventListener('resize', this.handlePanelResize);
  }

  destroyed() {
    if (this.stage) {
      this.stage.destroy();
    }
    window.document.body.removeEventListener('fullscreenchange', this.onFullscreenChange);
    window.removeEventListener('resize', this.handlePanelResize);
  }

  autoResize() {
    if (this.stage) {
      const elBox = this.getElBox();
      const width = elBox.width;
      const height = elBox.height;
      this.stage.width(width);
      this.stage.height(height);
      this.mainLayer?.draw();
    }
  }

  private init() {
    // if (this.stage) return;
    this.$nextTick(() => {
      const elBox = this.getElBox();
      const width = elBox.width;
      const height = elBox.height;

      Log.debug('DiagramPanel::initStage', this.position);

      const stage = new Konva.Stage({
        container: this.id,
        x: this.position?.x ?? 0,
        y: this.position?.y ?? 0,
        width,
        height,
        draggable: !this.noDraggable // || true
      });

      const layer = new Konva.Layer({
        // listening: false,
        // clearBeforeDraw: true
        // imageSmoothingEnabled: true
        // hitGraphEnabled
      });
      this.stage = stage;
      this.mainLayer = layer;
      this.stage.add(layer);

      while (this.onInitStageCallbacks.length > 0) {
        const callback = this.onInitStageCallbacks.pop();
        if (callback) {
          callback(this.stage, this.mainLayer);
        }
      }

      // stage.on('wheel', e => {
      //   e.evt.preventDefault();
      //   const dx = e.evt.deltaX;
      //   const dy = e.evt.deltaY;
      //   const x = Math.min(MAX_X, stage.x() - dx);
      //   const y = Math.min(MAX_Y, stage.y() - dy);
      //   stage.position({ x, y });
      //   layer.draw();
      // });

      stage.on('wheel', this.processWheel);
      if (!this.noDraggable) {
        stage.container().style.cursor = 'grab';
        stage.on('dragstart', e => {
          if (e.target === stage) {
            stage.container().style.cursor = 'grabbing';
            e.target.moveTo(this.mainLayer);
          }
        });
        stage.on('dragend', e => {
          Log.info(e);
          if (e.target === stage) {
            stage.container().style.cursor = 'grab';
          }
        });
      }

      Log.debug('DiagramPanel::initedStage', this.stage?.getPosition());
    });
  }

  private processWheel(e: KonvaEventObject<WheelEvent>) {
    if (!this.noScroll && this.stage && this.mainLayer) {
      e.evt.preventDefault();
      const oldScale = this.stage.scaleX();
      Log.info('wheel', { e, deltaY: e.evt.deltaY });
      const pointer = this.stage.getPointerPosition();
      if (pointer) {
        const mousePointTo = {
          x: (pointer.x - this.stage.x()) / oldScale,
          y: (pointer.y - this.stage.y()) / oldScale
        };
        const newScale = e.evt.deltaY > 0 ? oldScale / ZOOM_SCALE_RATIO : oldScale * ZOOM_SCALE_RATIO;
        this.stage.scale({ x: newScale, y: newScale });

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale
        };
        this.stage.position(newPos);
        this.mainLayer.draw();
        this.zoomPercent = (newScale * this.zoomPercent) / oldScale;
      }
    }
  }

  // getClientRect(): { x: number; y: number; width: number; height: number } | null {
  //   return this.stage?.getClientRect() ?? null;
  // }

  getInitPosition(): { x: number; y: number } | null {
    const stagePosition = this.stage?.position();
    const stageRect = this.stage?.getClientRect();
    const scale = this.stage?.scaleX();
    if (stagePosition && stageRect && scale) {
      return {
        x: (stagePosition.x - stageRect.x) / scale,
        y: (stagePosition.y - stageRect.y) / scale
      };
    }
    return null;
  }

  getBoundingClientRect() {
    if (this.stage) {
      return this.stage.container().getBoundingClientRect();
    }
    return null;
  }

  getPointerPosition() {
    if (this.stage) {
      return this.stage.getPointerPosition();
    }
    return null;
  }

  private updateStageSize() {
    if (this.stage) {
      const elBox = this.getElBox();
      const width = elBox.width;
      const height = elBox.height;
      Log.info('handlePanelResize', {
        width,
        height
      });
      if (width) {
        this.stage.width(width);
      }
      if (height) {
        this.stage.height(height);
      }
      if (width || height) {
        this.mainLayer?.draw();
      }
    }
  }

  private handlePanelResize() {
    this.$nextTick(() => {
      this.updateStageSize();
      setTimeout(this.updateStageSize, 200);
    });
  }

  public zoomIn() {
    this.processZoom(this.zoomPercent + this.zoomDelta);
  }

  public zoomOut() {
    this.processZoom(this.zoomPercent - this.zoomDelta);
  }

  public resetZoom() {
    if (this.stage) {
      this.processZoom(100, true);
    }
  }

  private processZoom(newZoomPercent: number, fitContent = false) {
    if (this.stage && newZoomPercent >= MIN_ZOOM) {
      const oldScale = this.stage.scaleX();
      const newScale = (oldScale * newZoomPercent) / this.zoomPercent;
      if (this.tween) {
        this.tween.destroy();
      }
      const tweenConfig: Konva.TweenConfig = {
        node: this.stage,
        duration: 0.2,
        scaleX: newScale,
        scaleY: newScale,
        easing: Konva.Easings.StrongEaseOut
      };
      if (fitContent) {
        // const currentScale = this.stage.scaleX();
        const stageRect = this.stage.getClientRect();
        const stagePosition = this.stage.position();

        Log.info('processZoom', {
          stageRect,
          stagePosition,
          x: ((stagePosition.x - stageRect.x) / oldScale) * newScale,
          y: ((stagePosition.y - stageRect.y) / oldScale) * newScale
        });

        tweenConfig.x = ((stagePosition.x - stageRect.x) / oldScale) * newScale;
        tweenConfig.y = ((stagePosition.y - stageRect.y) / oldScale) * newScale;
      }
      this.tween = new Konva.Tween(tweenConfig);
      this.tween.play();
      this.zoomPercent = newZoomPercent;
    }
  }

  private getElBox() {
    return this.bodyEl.getBoundingClientRect();
  }

  fitContent() {
    if (this.mainLayer && this.stage && this.bodyEl) {
      const stageRect = this.stage.getClientRect();
      const stagePosition = this.stage.position();
      const currentScale = this.stage.scaleX();
      const boxWidth = stageRect.width / currentScale;
      const boxHeight = stageRect.height / currentScale;
      const elBox = this.getElBox();
      const elWidth = elBox.width;
      const elHeight = elBox.height;
      const newScale = Math.min(elWidth / (boxWidth + FIT_CONTENT_OFFSET * 2), elHeight / (boxHeight + FIT_CONTENT_OFFSET * 2));

      if (this.tween) {
        this.tween.destroy();
      }
      const tweenOptions: Konva.TweenConfig = {
        node: this.stage,
        duration: 0.2,
        scaleX: newScale,
        scaleY: newScale,
        easing: Konva.Easings.StrongEaseOut,
        x: ((stagePosition.x - stageRect.x) / currentScale) * newScale,
        y: ((stagePosition.y - stageRect.y) / currentScale) * newScale
      };
      this.tween = new Konva.Tween(tweenOptions);
      this.tween.play();
      this.zoomPercent = (newScale * this.zoomPercent) / currentScale;
    }
  }

  toggleFullscreen() {
    if (this.isFullscreen) {
      document.exitFullscreen();
    } else {
      if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
      }
    }
  }

  private onFullscreenChange() {
    this.isFullscreen = !!document.fullscreenElement;
    this.$nextTick(() => {
      this.fitContent();
    });
    // this.handlePanelResize();
    // this.fitContent();
  }

  //
  // private updateStagePosition(position) {
  //   this.stage?.setPosition(position);
  // }

  // private emitPosition() {
  //   const stageRect = this.stage?.getClientRect();
  //   if (stageRect) {
  //     this.$emit('position', new PositionValue(stageRect.x, stageRect.y));
  //   }
  //   // const stagePosition = this.stage?.getPosition();
  //   // if (stagePosition && (this.position?.x !== stagePosition.x || this.position?.y !== stagePosition.y)) {
  //   //   this.$emit('position', new PositionValue(stagePosition.x, stagePosition.y));
  //   // }
  // }

  // @Watch('position', { deep: true })
  // private handlePositionChanged() {
  //   const stagePosition = this.stage?.getPosition();
  //   if (this.position && this.stage && (this.position.x !== stagePosition?.x || this.position.y !== stagePosition?.y)) {
  //     this.stage.setPosition(this.position);
  //     this.mainLayer?.draw();
  //   }
  // }
}
</script>
<style lang="scss" scoped>
.diagram-panel {
  background-color: #fff;
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  flex-direction: column;

  .diagram-panel-body {
    display: flex;
    height: calc(100% - 40px);
    width: 100%;

    &.no-control {
      height: 100%;
    }
  }

  .diagram-controls {
    display: flex;
    height: 40px;
    align-items: flex-end;
    z-index: 5;
    background-color: #fff;
  }

  &.diagram-fullscreen {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 12;

    .diagram-panel-body {
      height: calc(100% - 60px);
    }

    .diagram-controls {
      padding: 15px;
      height: 60px;
    }
  }

  .diagram-ghost {
    display: none;
    position: absolute;
    z-index: -1;
  }
}
</style>
