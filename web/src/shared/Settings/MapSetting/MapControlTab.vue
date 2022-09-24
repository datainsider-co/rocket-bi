<template>
  <PanelHeader header="Map Controls" target-id="map-control-tab">
    <div id="map-control">
      <ToggleSetting id="zoom-enable" :value="autoZoom" class="mb-3" label="Auto zoom" @onChanged="handleZoomEnabled" />
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { SeriesOptionData, SettingKey } from '@core/domain';

@Component({ components: { PanelHeader } })
export default class MapControlTab extends Vue {
  @Prop({ required: false, type: Object })
  private setting?: SeriesOptionData;

  private readonly defaultSetting = {
    autoZoom: true
  };

  private get autoZoom(): boolean {
    return this.setting?.mapNavigation?.enabled ?? this.defaultSetting.autoZoom;
  }

  private handleZoomEnabled(newValue: boolean) {
    this.$emit('onChanged', 'mapNavigation.enabled', newValue);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('mapNavigation.enabled', this.defaultSetting.autoZoom);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
