<template>
  <VueContext
    v-if="currentDrilldownMeta"
    ref="drilldownContext"
    :close-on-click="false"
    :close-on-scroll="false"
    class="drilldown-context-menu"
    tag="div"
    @close="removeListenScroll"
  >
    <DrilldownSetting
      :defaultDrilldownValue="defaultDrilldownValue"
      :displayType="DisplayTypes.Context"
      :metaData="currentDrilldownMeta"
      :extraData="extraData"
      class="context-drilldown"
      @hide="hide"
    />
  </VueContext>
</template>

<script lang="ts">
import { Component, Ref } from 'vue-property-decorator';
import { ChartInfo, QueryRelatedWidget } from '@core/common/domain';
import DrilldownSetting, { DisplayTypes } from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/drilldown/DrilldownSetting.vue';
import VueContext from 'vue-context';
import { AutoHideContextMenu } from '@/screens/dashboard-detail/components/AutoHideContextMenu';
import { MouseEventData } from '@chart/BaseChart';
import { get } from 'lodash';

@Component({
  components: {
    DrilldownSetting,
    VueContext
  }
})
export default class DrilldownSettingContextMenu extends AutoHideContextMenu {
  private defaultDrilldownValue = '';
  private currentDrilldownMeta: ChartInfo | null = null;
  private code: string | null = null;
  private DisplayTypes = DisplayTypes;

  @Ref()
  private readonly drilldownContext?: VueContext;

  show(metaData: ChartInfo, event: MouseEventData<string>): void {
    this.hide();
    this.$nextTick(() => {
      this.currentDrilldownMeta = metaData;
      // prevent data is not a string
      this.defaultDrilldownValue = event.data?.toString() || '';
      // Khi  sử dụng với Map,  cần code Map để get map tương ứng cho hiển thị
      this.code = get(event.extraData, 'point.options.code', null);
      this.$nextTick(() => {
        this.drilldownContext?.open(event.event, {});
      });
    });
    this.listenScroll();
  }

  hide() {
    this.currentDrilldownMeta = null;
    this.drilldownContext?.close();
  }
  get extraData(): any {
    return {
      code: this.code
    };
  }
}
</script>

<style lang="scss">
div.v-context.drilldown-context-menu {
  background: var(--menu-background-color);
  border: var(--menu-border);
  box-shadow: var(--menu-shadow);
  border-radius: 4px;
  height: 450px;
  max-height: 450px;
  width: 300px;
  overflow: hidden;

  .popover-panel {
    background-color: unset;
    border: unset;
    box-shadow: unset;
    border-radius: unset;
  }

  .custom-listing {
    max-height: 294px;
  }
}
</style>
