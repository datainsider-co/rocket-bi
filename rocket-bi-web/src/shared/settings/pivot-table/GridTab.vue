<template>
  <PanelHeader ref="panel" header="Grid" target-id="grid-tab">
    <!--   Vertical Grid Setting-->
    <div class="row-config-container">
      <ColorSetting
        id="vertical-grid-color"
        :default-color="verticalColor"
        :value="verticalColor"
        label="Vertical grid color"
        style="width: 145px; margin-right: 12px"
        @onChanged="handleVerticalColorChanged"
      />
      <DropdownSetting
        id="vertical-grid-thickness"
        :options="thickNessOptions"
        :value="verticalThickness"
        label="Thickness"
        size="small"
        style="width: 64px;"
        @onChanged="handleVerticalThicknessChanged"
      />
    </div>
    <div class="row-config-container">
      <ToggleSetting id="vertical-enable-header" :value="verticalHeaderEnabled" class="mr-4" label="Header" @onChanged="handleVerticalHeaderEnabled" />
      <ToggleSetting id="vertical-enable-body" :value="verticalBodyEnabled" class="mr-4" label="Body" @onChanged="handleVerticalBodyEnabled" />
      <ToggleSetting id="vertical-enable-total" :value="verticalTotalEnabled" label="Total" @onChanged="handleVerticalTotalEnabled" />
    </div>
    <!--   Horizontal Grid Setting-->
    <div class="row-config-container">
      <ColorSetting
        id="horizontal-grid-color"
        :default-color="horizontalColor"
        :value="horizontalColor"
        label="Horizontal grid color"
        style="width: 145px; margin-right: 12px"
        @onChanged="handleHorizontalColorChanged"
      />
      <DropdownSetting
        id="horizontal-grid-thickness"
        :options="thickNessOptions"
        :value="horizontalThickness"
        label="Thickness"
        size="small"
        style="width: 64px;margin-right: 12px;"
        @onChanged="handleHorizontalThicknessChanged"
      />
      <DropdownSetting
        id="horizontal-row-padding"
        :options="rowPaddingOptions"
        :value="horizontalRowPadding"
        disable
        label="Row padding"
        size="small"
        @onChanged="handleHorizontalRowPaddingChanged"
      />
    </div>
    <div class="row-config-container">
      <ToggleSetting id="horizontal-enable-header" :value="horizontalHeaderEnabled" class="mr-4" label="Header" @onChanged="handleHorizontalHeaderEnabled" />
      <ToggleSetting id="horizontal-enable-body" :value="horizontalBodyEnabled" class="mr-4" label="Body" @onChanged="handleHorizontalBodyEnabled" />
      <ToggleSetting id="horizontal-enable-total" :value="horizontalTotalEnabled" label="Total" @onChanged="handleHorizontalTotalEnabled" />
    </div>
    <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { ChartOption, PivotTableChartOption, SettingKey } from '@core/common/domain';
import { SelectOption } from '@/shared';
import { ListUtils } from '@/utils';

@Component({ components: { PanelHeader } })
export default class GridTab extends Vue {
  static readonly defaultSetting = {
    verticalColor: ChartOption.getTableGridLineColor(),
    verticalThickness: '1px',
    verticalHeader: true,
    verticalBody: true,
    verticalTotal: true,
    horizontalColor: ChartOption.getTableGridLineColor(),
    horizontalThickness: '1px',
    horizontalHeader: true,
    horizontalBody: false,
    horizontalTotal: true,
    rowPadding: '0px'
  };
  @Prop({ required: false, type: Object })
  private readonly setting!: PivotTableChartOption;

  @Ref()
  private panel!: PanelHeader;

  private get verticalColor(): string {
    return this.setting?.options?.grid?.vertical?.color ?? GridTab.defaultSetting.verticalColor;
  }

  /*
   *Vertical
   * */

  private get verticalThickness(): string {
    return this.setting?.options?.grid?.vertical?.thickness ?? GridTab.defaultSetting.verticalThickness;
  }

  private get verticalHeaderEnabled(): boolean {
    return this.setting?.options?.grid?.vertical?.applyHeader ?? GridTab.defaultSetting.verticalHeader;
  }

  private get verticalBodyEnabled(): boolean {
    return this.setting?.options?.grid?.vertical?.applyBody ?? GridTab.defaultSetting.verticalBody;
  }

  private get verticalTotalEnabled(): boolean {
    return this.setting?.options?.grid?.vertical?.applyTotal ?? GridTab.defaultSetting.verticalTotal;
  }

  private get horizontalColor(): string {
    return this.setting?.options?.grid?.horizontal?.color ?? GridTab.defaultSetting.horizontalColor;
  }

  /*
   *Horizontal
   */

  private get horizontalThickness(): string {
    return this.setting?.options?.grid?.horizontal?.thickness ?? GridTab.defaultSetting.horizontalThickness;
  }

  private get horizontalRowPadding(): string {
    return this.setting?.options?.grid?.horizontal?.rowPadding ?? GridTab.defaultSetting.rowPadding;
  }

  private get horizontalHeaderEnabled(): boolean {
    return this.setting?.options?.grid?.horizontal?.applyHeader ?? GridTab.defaultSetting.horizontalHeader;
  }

  private get horizontalBodyEnabled(): boolean {
    return this.setting?.options?.grid?.horizontal?.applyBody ?? GridTab.defaultSetting.horizontalBody;
  }

  private get horizontalTotalEnabled(): boolean {
    return this.setting?.options?.grid?.horizontal?.applyTotal ?? GridTab.defaultSetting.horizontalTotal;
  }

  private get thickNessOptions(): SelectOption[] {
    return ListUtils.generate(10, index => {
      const key = index + 1;
      return {
        displayName: key.toString(),
        id: `${key}px`
      };
    });
  }

  private get rowPaddingOptions(): SelectOption[] {
    return ListUtils.generate(21, index => {
      const key = index;
      return {
        displayName: key.toString(),
        id: `${key}px`
      };
    });
  }

  mounted() {
    // this.panel.expand();
  }

  private handleVerticalHeaderEnabled(newValue: boolean) {
    return this.$emit('onChanged', 'grid.vertical.applyHeader', newValue);
  }

  private handleVerticalBodyEnabled(newValue: boolean) {
    return this.$emit('onChanged', 'grid.vertical.applyBody', newValue);
  }

  private handleVerticalTotalEnabled(newValue: boolean) {
    return this.$emit('onChanged', 'grid.vertical.applyTotal', newValue);
  }

  private handleVerticalColorChanged(newColor: string) {
    return this.$emit('onChanged', 'grid.vertical.color', newColor);
  }

  private handleVerticalThicknessChanged(newThickness: string) {
    return this.$emit('onChanged', 'grid.vertical.thickness', newThickness);
  }

  private handleHorizontalEnabled(newValue: boolean) {
    return this.$emit('onChanged', 'grid.horizontal.enabled', newValue);
  }

  private handleHorizontalColorChanged(newColor: string) {
    return this.$emit('onChanged', 'grid.horizontal.color', newColor);
  }

  private handleHorizontalThicknessChanged(newThickness: string) {
    return this.$emit('onChanged', 'grid.horizontal.thickness', newThickness);
  }

  private handleHorizontalRowPaddingChanged(newPadding: string) {
    return this.$emit('onChanged', 'grid.horizontal.rowPadding', newPadding);
  }

  private handleHorizontalHeaderEnabled(newValue: boolean) {
    return this.$emit('onChanged', 'grid.horizontal.applyHeader', newValue);
  }

  private handleHorizontalBodyEnabled(newValue: boolean) {
    return this.$emit('onChanged', 'grid.horizontal.applyBody', newValue);
  }

  private handleHorizontalTotalEnabled(newValue: boolean) {
    return this.$emit('onChanged', 'grid.horizontal.applyTotal', newValue);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('grid.vertical.applyHeader', GridTab.defaultSetting.verticalHeader);
    settingAsMap.set('grid.vertical.applyBody', GridTab.defaultSetting.verticalBody);
    settingAsMap.set('grid.vertical.applyTotal', GridTab.defaultSetting.verticalTotal);
    settingAsMap.set('grid.vertical.thickness', GridTab.defaultSetting.verticalThickness);
    settingAsMap.set('grid.vertical.color', GridTab.defaultSetting.verticalColor);

    settingAsMap.set('grid.horizontal.applyHeader', GridTab.defaultSetting.horizontalHeader);
    settingAsMap.set('grid.horizontal.applyBody', GridTab.defaultSetting.horizontalBody);
    settingAsMap.set('grid.horizontal.applyTotal', GridTab.defaultSetting.horizontalTotal);
    settingAsMap.set('grid.horizontal.thickness', GridTab.defaultSetting.horizontalThickness);
    settingAsMap.set('grid.horizontal.color', GridTab.defaultSetting.horizontalColor);
    settingAsMap.set('grid.horizontal.rowPadding', GridTab.defaultSetting.rowPadding);

    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss" />
