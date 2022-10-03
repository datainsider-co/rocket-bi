<template>
  <DIPopover
    :isShow="true"
    :targetId="targetId"
    custom-class="zoom-popover"
    is-show-header
    is-show-title
    placement="bottom-left"
    @update:isShow="handleHidePopover"
    triggers="blur"
  >
    <ZoomSetting :meta-data="metaData" @onZoom="handleZoom"></ZoomSetting>
  </DIPopover>
</template>

<script lang="ts">
import { Component, Emit, Inject, Prop, Vue } from 'vue-property-decorator';
import DIPopover from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/DIPopover.vue';
import { ChartInfo } from '@core/common/domain/model';
import DiButton from '@/shared/components/common/DiButton.vue';
import ZoomSetting from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/zoom/ZoomSetting.vue';

@Component({ components: { ZoomSetting, DIPopover, DiButton } })
export default class ZoomSettingPopover extends Vue {
  @Prop({ required: true, type: Object })
  private metaData!: ChartInfo;

  @Prop({ required: true, type: String })
  private targetId!: string;

  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private readonly zoom?: (nextLvl: string) => void;

  private handleZoom(zoomLevel: string) {
    this.handleHidePopover();
    if (this.zoom) {
      this.zoom(zoomLevel);
    }
  }

  @Emit('hide')
  private handleHidePopover(currentEvent?: Event) {
    return currentEvent ?? event;
  }
}
</script>

<style lang="scss">
.zoom-popover .popover-body {
  min-width: 160px;
}
.zoom-popover .custom-popover {
  padding: 8px 0;
}
</style>
