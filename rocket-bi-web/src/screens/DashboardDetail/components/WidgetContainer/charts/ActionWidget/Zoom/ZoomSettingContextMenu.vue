<template>
  <VueContext v-if="metaData" ref="zoomMenu" :close-on-click="false" class="zoom-context-menu" tag="div">
    <ZoomSetting :meta-data="metaData" @onZoom="handleZoom"></ZoomSetting>
  </VueContext>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { ChartInfo } from '@core/domain';
import ZoomSetting from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/Zoom/ZoomSetting.vue';
import { ZoomModule } from '@/store/modules/zoom.store';
import { DashboardControllerModule } from '@/screens/DashboardDetail/stores';
import { Log } from '@core/utils';
import VueContext from 'vue-context';
import { MouseEventData } from '@chart/BaseChart';

@Component({
  components: { ZoomSetting, VueContext }
})
export default class ZoomSettingContextMenu extends Vue {
  private metaData: ChartInfo | null = null;

  @Ref()
  private readonly zoomMenu?: VueContext;

  show(metaData: ChartInfo, event: MouseEvent): void {
    this.hide();
    this.metaData = metaData;
    this.$nextTick(() => {
      this.zoomMenu?.open(event, {});
    });
  }

  hide() {
    this.zoomMenu?.close();
  }

  private async handleZoom(zoomLevel: string): Promise<void> {
    this.hide();
    try {
      ZoomModule.zoomChart({ chart: this.metaData!, nextLvl: zoomLevel });
      await DashboardControllerModule.renderChartOrFilter({ widget: this.metaData!, forceFetch: false });
    } catch (ex) {
      Log.error('handleZoom::', this.metaData?.id, 'error::', ex);
    }
  }
}
</script>

<style lang="scss">
div.v-context.zoom-context-menu {
  min-width: 160px;
  border: var(--menu-border);
  box-shadow: var(--menu-shadow);
  max-height: 350px;
  overflow-y: auto;
}
</style>
