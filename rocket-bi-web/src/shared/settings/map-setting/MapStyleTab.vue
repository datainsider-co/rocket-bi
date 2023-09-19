<template>
  <PanelHeader header="Map Controls" target-id="map-control-tab">
    <div id="map-control">
      <DropdownSetting
        id="font-family"
        :options="geoAreaOptions"
        :value="geoArea"
        class="mb-3"
        :label="`${configSetting['map.select'].label}`"
        :hint="`${configSetting['map.select'].hint}`"
        size="full"
        @onChanged="handleMapChanged"
      />
      <ToggleSetting
        id="data-label-enable"
        :value="enabled"
        class="mb-3 group-config"
        :label="`${configSetting['label.enabled'].label}`"
        :hint="`${configSetting['label.enabled'].hint}`"
        @onChanged="handleDataLabelEnabled"
      />
      <DropdownSetting
        id="data-label-font-family"
        :options="fontOptions"
        :value="font"
        class="mb-2"
        :label="`${configSetting['label.fontFamily'].label}`"
        :hint="`${configSetting['label.fontFamily'].hint}`"
        size="full"
        @onChanged="handleFontChanged"
      />
      <div class="row-config-container">
        <ColorSetting
          id="data-label-font-color"
          :default-color="defaultSetting.color"
          :value="color"
          class="mr-2"
          :label="`${configSetting['label.color'].label}`"
          :hint="`${configSetting['label.color'].hint}`"
          size="small"
          @onChanged="handleColorChanged"
        />
        <DropdownSetting
          id="data-label-font-size"
          :label="`${configSetting['label.fontSize'].label}`"
          :hint="`${configSetting['label.fontSize'].hint}`"
          :options="fontSizeOptions"
          :value="fontSize"
          size="small"
          @onChanged="handleFontSizeChanged"
        />
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { ChartOption, SeriesOptionData, SettingKey } from '@core/common/domain';

import { SelectOption } from '@/shared';
import { GeolocationModule } from '@/store/modules/data-builder/GeolocationStore';
import { get } from 'lodash';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { SecondaryFontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { StringUtils } from '@/utils';

@Component({ components: { PanelHeader } })
export default class MapStyleTab extends Vue {
  private readonly configSetting = window.chartSetting['map.tab'];
  @Prop({ required: false, type: Object })
  private setting?: SeriesOptionData;

  private readonly defaultSetting = {
    geoArea: 'world.json',
    enabled: false,
    fontFamily: ChartOption.getSecondaryFontFamily(),
    color: ChartOption.getPrimaryTextColor(),
    fontSize: '12px'
  };

  private get geoArea(): string {
    return this.setting?.geoArea ?? this.defaultSetting.geoArea;
  }

  private get geoAreaOptions(): SelectOption[] {
    return Array.from(GeolocationModule.areaAsMap.values())
      .map<SelectOption>(area => ({
        id: area.mapUrl,
        displayName: area.displayName
      }))
      .sort((a, b) => StringUtils.compare(a.displayName, b.displayName));
  }

  private get enabled(): boolean {
    return get(this.setting, `plotOptions.map.dataLabels.enabled`, this.defaultSetting.enabled);
  }

  private get fontOptions(): SelectOption[] {
    return FontFamilyOptions;
  }

  private get fontSizeOptions(): SelectOption[] {
    return SecondaryFontSizeOptions;
  }

  private get font(): string {
    return get(this.setting, `plotOptions.map.dataLabels.style.fontFamily`, this.defaultSetting.fontFamily);
  }

  private get color(): string {
    return get(this.setting, `plotOptions.map.dataLabels.style.color`, this.defaultSetting.color);
  }

  private get fontSize(): string {
    return get(this.setting, `plotOptions.map.dataLabels.style.fontSize`, this.defaultSetting.fontSize);
  }

  private handleMapChanged(newValue: string) {
    this.$emit('onChangeAndQuery', 'geoArea', newValue);
    GeolocationModule.loadListGeolocationWithCode({ code: newValue });
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`plotOptions.map.dataLabels.style.fontFamily`, this.defaultSetting.fontFamily);
    settingAsMap.set(`plotOptions.map.dataLabels.style.color`, this.defaultSetting.color);
    settingAsMap.set(`plotOptions.map.dataLabels.style.fontSize`, this.defaultSetting.fontSize);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleDataLabelEnabled(enabled: boolean) {
    return this.$emit('onChanged', `plotOptions.map.dataLabels.enabled`, enabled);
  }

  private handleFontChanged(newFont: string) {
    return this.$emit('onChanged', `plotOptions.map.dataLabels.style.fontFamily`, newFont);
  }

  private handleColorChanged(newColor: string) {
    return this.$emit('onChanged', `plotOptions.map.dataLabels.style.color`, newColor);
  }

  private handleFontSizeChanged(newFontSize: string) {
    this.$emit('onChanged', `plotOptions.map.dataLabels.style.fontSize`, newFontSize);
  }
}
</script>

<style lang="scss" scoped></style>
