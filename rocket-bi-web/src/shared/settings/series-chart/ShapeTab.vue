<template>
  <PanelHeader header="Shape" target-id="shape-tab">
    <div class="shape-tab">
      <div class="row-config-container">
        <DropdownSetting id="shape-line-dash-style" :options="dashOptions" :value="dash" size="half" style="margin-right: 12px" @onChanged="handleDashChange" />
        <DropdownSetting id="shape-line-width" :options="widthOptions" :value="width" disabled size="small" @onChanged="handleWidthChange" />
      </div>
      <ToggleSetting id="shape-show-marker" :value="showMarker" class="mb-3" label="Show marker" @onChanged="handleMarkerEnable" />
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { PlotOptions } from '@core/common/domain/model/chart-option/extra-setting/chart-style/PlotOptions';
import { DashOptions } from '@/shared/settings/common/options/DashOptions';
import { ListUtils } from '@/utils';
import { SettingKey } from '@core/common/domain';

@Component({ components: { PanelHeader } })
export default class ShapeTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: PlotOptions;

  private readonly defaultSetting = {
    width: 2,
    dash: 'Solid',
    showMarker: true
  };

  private get width(): number {
    return this.setting?.series?.lineWidth ?? this.defaultSetting.width;
  }

  private get dash(): string {
    return this.setting?.series?.dashStyle ?? this.defaultSetting.dash;
  }

  private get showMarker(): boolean {
    return this.setting?.series?.marker?.enabled ?? this.defaultSetting.showMarker;
  }

  private get dashOptions() {
    return DashOptions;
  }

  private get widthOptions() {
    return ListUtils.generate(10, index => {
      const key = index + 1;
      return {
        displayName: key.toString(),
        id: key
      };
    });
  }

  private handleWidthChange(newWidth: number) {
    return this.$emit('onChanged', 'plotOptions.series.lineWidth', newWidth);
  }

  private handleDashChange(newDash: string) {
    return this.$emit('onChanged', 'plotOptions.series.dashStyle', newDash);
  }

  private handleMarkerEnable(enabled: boolean) {
    return this.$emit('onChanged', 'plotOptions.series.marker.enabled', enabled);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('plotOptions.series.lineWidth', this.defaultSetting.width);
    settingAsMap.set('plotOptions.series.dashStyle', this.defaultSetting.dash);
    settingAsMap.set('plotOptions.series.marker.enabled', this.defaultSetting.showMarker);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
