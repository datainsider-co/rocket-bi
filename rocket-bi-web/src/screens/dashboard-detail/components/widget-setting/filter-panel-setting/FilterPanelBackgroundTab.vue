<template>
  <PanelHeader header="Background" target-id="background-tab">
    <div class="row-config-container justify-content-between">
      <ColorSetting
        id="background-color-active-setting"
        :default-color="defaultSetting.header.active.background"
        label="Background"
        :value="tab.extraData.header.active.background"
        size="half"
        @onChanged="handleBackgroundActiveChanged"
      />
    </div>
    <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Vue, PropSync } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { GroupFilter, TabWidget, TabWidgetOptions } from '@core/common/domain';
import { set } from 'lodash';

@Component({ components: { PanelHeader } })
export default class FilterPanelBackgroundTab extends Vue {
  @PropSync('widget')
  tab!: TabWidget;

  private get defaultSetting(): TabWidgetOptions {
    return GroupFilter.defaultSetting();
  }
  private handleBackgroundActiveChanged(color: string) {
    set(this.tab, 'extraData.header.active.background', color);
  }
  private handleRevert() {
    set(this.tab, 'extraData.header.active.background', this.defaultSetting.header?.active?.background);
  }
}
</script>
