<template>
  <div class="row zoom" v-if="showZoomOut || showZoomIn">
    <div class="row no-gutters">
      <span class="btn-icon cursor-pointer" v-if="showZoomOut" @click="handleZoomOut">
        <img class="icon-title di-popup" src="@/assets/icon/ic-16-zoom-out.svg" alt="Adding" />
      </span>
      <span class="btn-icon cursor-pointer" v-if="showZoomIn" @click="handleZoomIn">
        <img class="icon-title di-popup" src="@/assets/icon/ic-16-zoom-in.svg" alt="Adding" />
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ZoomControlBar extends Vue {
  @Prop({ type: Boolean, default: false })
  showZoomIn!: boolean;
  @Prop({ type: Boolean, default: false })
  showZoomOut!: boolean;

  //Provide from ChartContainer/ChartPreview
  @Inject({ default: undefined })
  zoomIn?: () => void;
  //Provide from ChartContainer/ChartPreview
  @Inject({ default: undefined })
  zoomOut?: () => void;

  handleZoomIn() {
    if (this.zoomIn) {
      this.zoomIn();
    }
  }

  handleZoomOut() {
    if (this.zoomOut) {
      this.zoomOut();
    }
  }
}
</script>

<style lang="scss" scoped>
.zoom {
  box-sizing: border-box;
  float: right;
}
</style>
