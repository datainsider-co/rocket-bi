<template>
  <PanelHeader header="Display" target-id="display-tab">
    <div class="display-tab">
      <DropdownSetting id="display-selection" :options="seriesOptions" :value="selectedLegend" class="mb-3" size="full" @onSelected="handleSelectedLegend" />
      <InputSetting id="display-name-setting" :value="displayName" class="mb-3" label="Display Name" @onChanged="handleDisplayNameChanged" />
      <div class="row-config-container align-items-end">
        <DropdownSetting
          id="display-type"
          :options="widgetTypeOptions"
          :value="type"
          class="mr-2"
          disabled
          label="Display"
          size="half"
          @onChanged="handleTypeChanged"
        />
        <ToggleSetting v-if="enableMarkerSetting" id="display-show-marker" :value="showMarker" label="Show marker" @onChanged="handleMarkerEnable" />
      </div>
      <div class="row-config-container" v-if="enableWidthLineSetting">
        <DropdownSetting
          id="display-line-dash-style"
          :options="dashOptions"
          :value="dash"
          size="half"
          style="margin-right: 12px"
          @onChanged="handleDashChange"
        />
        <DropdownSetting id="display-line-width" :options="widthOptions" :value="width" disabled size="small" @onChanged="handleWidthChange" />
      </div>
      <ToggleSetting
        v-if="seriesOptions.length > 1 && enableDualAxis"
        id="use-dual-axis"
        :value="useDualAxis"
        label="Use Second Axis"
        @onChanged="handleUseDualAxis"
      />

      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { PlotOptions } from '@core/common/domain/model/chart-option/extra-setting/chart-style/PlotOptions';
import { DashOptions } from '@/shared/settings/common/options/DashOptions';
import { ListUtils } from '@/utils';
import { ChartType, SelectOption } from '@/shared';
import { get } from 'lodash';
import { AxisSetting, SettingKey } from '@core/common/domain';

@Component({ components: { PanelHeader } })
export default class DisplayTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: PlotOptions;

  @Prop({ required: false, type: Array })
  private readonly axisSetting!: AxisSetting[];

  @Prop({ required: false, type: Array })
  private readonly seriesOptions?: SelectOption[];
  @Prop({ required: false, type: String })
  private readonly widgetType!: ChartType;

  private selectedLegend = '';

  @Watch('seriesOptions', { immediate: true })
  onResponseChanged() {
    this.selectedLegend = get(this.seriesOptions, '[0].id', '');
  }

  private readonly defaultSetting = {
    width: 2,
    dash: 'Solid',
    showMarker: false
  };

  private get selectedOption(): SelectOption | undefined {
    return this.seriesOptions?.find(series => series.id === this.selectedLegend);
  }

  private get width(): number {
    return get(this.setting, `series.response.${this.selectedLegend}.lineWidth`, this.defaultSetting.width);
  }

  private get dash(): string {
    return get(this.setting, `series.response.${this.selectedLegend}.dashStyle`, this.defaultSetting.dash);
  }

  private get showMarker(): boolean {
    return get(this.setting, `series.response.${this.selectedLegend}.marker.enabled`, this.defaultSetting.showMarker);
  }

  private get type(): ChartType {
    return get(this.setting, `series.response.${this.selectedLegend}.type`, this.widgetType);
  }

  private get displayName(): string {
    return get(this.setting, `series.response.${this.selectedLegend}.name`, this.selectedOption?.displayName);
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

  private get widgetTypeOptions(): SelectOption[] {
    let columnOption = { displayName: 'Column', id: ChartType.Column };
    switch (this.widgetType) {
      case ChartType.Bar:
        columnOption = { displayName: 'Bar', id: ChartType.Bar };
        break;
    }
    return [
      columnOption,
      { displayName: 'Line', id: ChartType.Line },
      {
        displayName: 'Area',
        id: ChartType.Area
      },
      {
        displayName: 'Lollipop',
        id: ChartType.Lollipop
      }
    ];
  }

  private get enableMarkerSetting(): boolean {
    switch (this.type) {
      case ChartType.Column:
      case ChartType.Bar:
        return false;
      default:
        return true;
    }
  }

  private get enableWidthLineSetting(): boolean {
    switch (this.type) {
      case ChartType.Line:
      case ChartType.Area:
      case ChartType.AreaSpline:
        return true;
      default:
        return false;
    }
  }

  private handleWidthChange(newWidth: number) {
    return this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.lineWidth`, newWidth);
  }

  private handleDashChange(newDash: string) {
    return this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.dashStyle`, newDash);
  }

  private handleMarkerEnable(enabled: boolean) {
    return this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.marker.enabled`, enabled);
  }

  private handleTypeChanged(type: string) {
    this.configMarker(type as ChartType);
    this.configType(type as ChartType);
  }

  private configMarker(type: ChartType) {
    const isLollipop = type === ChartType.Lollipop;
    if (isLollipop) {
      const enableMarker = true;
      this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.marker.enabled`, enableMarker);
    }
  }

  private configType(type: ChartType) {
    this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.type`, type);
  }

  private handleDisplayNameChanged(name: string) {
    return this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.name`, name);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`plotOptions.series.response.${this.selectedLegend}.lineWidth`, this.defaultSetting.width);
    settingAsMap.set(`plotOptions.series.response.${this.selectedLegend}.dashStyle`, this.defaultSetting.dash);
    settingAsMap.set(`plotOptions.series.response.${this.selectedLegend}.marker.enabled`, this.defaultSetting.showMarker);
    settingAsMap.set(`plotOptions.series.response.${this.selectedLegend}.type`, this.widgetType);
    settingAsMap.set(`plotOptions.series.response.${this.selectedLegend}.name`, this.selectedOption?.displayName ?? '');
    settingAsMap.set(`plotOptions.series.response.${this.selectedLegend}.yAxis`, 0);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleSelectedLegend(newLegend: SelectOption) {
    this.selectedLegend = newLegend.id.toString();
  }

  private get enableDualAxis(): boolean {
    return get(this.axisSetting, '[1].visible', false);
  }

  private get useDualAxis(): boolean {
    const axis = get(this.setting, `series.response.${this.selectedLegend}.yAxis`, 0);
    return axis != 0;
  }

  private handleUseDualAxis(enable: boolean) {
    return this.$emit('onChanged', `plotOptions.series.response.${this.selectedLegend}.yAxis`, +enable);
  }
}
</script>

<style lang="scss" scoped></style>
