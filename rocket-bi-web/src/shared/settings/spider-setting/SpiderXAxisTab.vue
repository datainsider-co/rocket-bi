<template>
  <PanelHeader header="X Axis" target-id="x-axis-tab">
    <div class="x-axis-tab">
      <ToggleSetting
        id="x-axis-enable"
        :value="enabled"
        class="mb-3 group-config"
        :label="`${configSetting['xaxis.enabled'].label}`"
        :hint="`${configSetting['xaxis.enabled'].hint}`"
        @onChanged="handleAxisEnabled"
      />
      <div :style="axisSettingStyle">
        <!--      Prefix setting-->
        <!--      Postfix setting-->
        <div class="row-config-container">
          <InputSetting
            id="x-axis-prefix-input"
            :value="prefixText"
            class="mr-2"
            :label="`${configSetting['label.prefix.text'].label}`"
            :hint="`${configSetting['label.prefix.text'].hint}`"
            :placeholder="`${configSetting['label.prefix.text'].placeHolder}`"
            size="half"
            :maxLength="defaultSetting.prefixMaxLength"
            @onChanged="handlePrefixSaved"
          />
          <InputSetting
            id="x-axis-postfix-input"
            :value="postfixText"
            :label="`${configSetting['label.postfix.text'].label}`"
            :hint="`${configSetting['label.postfix.text'].hint}`"
            :placeholder="`${configSetting['label.postfix.text'].placeHolder}`"
            size="half"
            @onChanged="handlePostfixSaved"
            :maxLength="defaultSetting.suffixMaxLength"
          />
        </div>
        <DropdownSetting
          id="x-axis-category-font-family"
          :options="fontOptions"
          :value="categoryFont"
          class="mb-2"
          :label="`${configSetting['xaxis.label.fontFamily'].label}`"
          :hint="`${configSetting['xaxis.label.fontFamily'].hint}`"
          size="full"
          @onChanged="handleCategoryFontChanged"
        />
        <div class="row-config-container">
          <ColorSetting
            id="x-axis-category-font-color"
            :default-color="defaultSetting.categoryColor"
            :value="categoryColor"
            class="mr-2"
            size="small"
            :label="`${configSetting['xaxis.label.color'].label}`"
            :hint="`${configSetting['xaxis.label.color'].hint}`"
            @onChanged="handleCategoryColorChanged"
          />
          <DropdownSetting
            id="x-axis-category-font-size"
            :options="fontSizeOptions"
            :value="categoryFontSize"
            size="small"
            :label="`${configSetting['xaxis.label.fontSize'].label}`"
            :hint="`${configSetting['xaxis.label.fontSize'].hint}`"
            @onChanged="handleCategoryFontSizeChanged"
          />
        </div>
        <div v-if="enableSettingGridLine" class="mb-3">
          <ToggleSetting
            id="x-axis-grid-enable"
            :value="gridEnabled"
            class="mb-3 group-config"
            :label="`${configSetting['xaxis.grid.enabled'].label}`"
            :hint="`${configSetting['xaxis.grid.enabled'].hint}`"
            @onChanged="handleGridEnabled"
          />
          <div :style="gridLineChildrenSettingStyle" class="row-config-container">
            <ColorSetting
              id="x-axis-grid-line-color"
              :default-color="defaultSetting.gridLineColor"
              :value="gridLineColor"
              class="mr-2"
              size="half"
              :label="`${configSetting['xaxis.grid.color'].label}`"
              :hint="`${configSetting['xaxis.grid.color'].hint}`"
              @onChanged="handleGridColorChanged"
            />
            <InputSetting
              id="x-axis-grid-line-width"
              :value="gridLineWidth"
              :label="`${configSetting['xaxis.grid.width'].label}`"
              :hint="`${configSetting['xaxis.grid.width'].hint}`"
              :placeholder="`${configSetting['xaxis.grid.width'].placeHolder}`"
              size="small"
              type="number"
              @onChanged="handleGridLineWidthChanged"
            />
          </div>
          <DropdownSetting
            id="x-axis-grid-line-dash-style"
            :options="dashOptions"
            :style="gridLineChildrenSettingStyle"
            :value="gridLineDashStyle"
            :label="`${configSetting['xaxis.grid.dash'].label}`"
            :hint="`${configSetting['xaxis.grid.dash'].hint}`"
            size="full"
            @onChanged="handleGridLineDashStyleChanged"
          />
        </div>
      </div>
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { AxisSetting, ChartOption, HeatMapQuerySetting, QuerySettingType, ScatterQuerySetting, SeriesQuerySetting, SettingKey } from '@core/common/domain';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting.ts';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { DashOptions } from '@/shared/settings/common/options/DashOptions';
import { ListUtils } from '@/utils';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { enableCss } from '@/shared/settings/common/install';

@Component({ components: { PanelHeader } })
export default class SpiderXAxisTab extends Vue {
  private readonly configSetting = window.chartSetting['xaxis.tab'];

  @Prop({ required: false, type: Array })
  private readonly setting!: AxisSetting[];
  @Prop({ required: false, type: Object })
  private readonly query!: QuerySetting;
  private readonly defaultSetting = {
    visible: true,
    categoryFont: 'Roboto',
    categoryColor: ChartOption.getThemeTextColor(),
    categoryFontSize: '11px',
    gridLineColor: ChartOption.getGridLineColor(),
    gridLineDashStyle: 'Solid',
    gridLineWidth: '0.5',
    prefixMaxLength: 10,
    suffixMaxLength: 10,
    prefixText: '',
    postfixText: ''
  };

  private get enabled(): boolean {
    if (this.setting && this.setting[0]) {
      return this.setting[0].visible ?? this.defaultSetting.visible;
    }
    return this.defaultSetting.visible;
  }

  private get categoryFont(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].labels?.style?.fontFamily ?? this.defaultSetting.categoryFont;
    }
    return this.defaultSetting.categoryFont;
  }

  private get categoryColor(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].labels?.style?.color ?? this.defaultSetting.categoryColor;
    }
    return this.defaultSetting.categoryColor;
  }

  private get categoryFontSize(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].labels?.style?.fontSize ?? this.defaultSetting.categoryFontSize;
    }
    return this.defaultSetting.categoryFontSize;
  }

  private get fontOptions() {
    return FontFamilyOptions;
  }

  private get fontSizeOptions() {
    return FontSizeOptions;
  }

  private get gridLineColor(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].gridLineColor ?? this.defaultSetting.gridLineColor;
    }
    return this.defaultSetting.gridLineColor;
  }

  private get gridLineWidth(): string {
    if (this.setting && this.setting[0]) {
      return `${this.setting[0].gridLineWidth}` ?? this.defaultSetting.gridLineWidth;
    }
    return this.defaultSetting.gridLineWidth;
  }

  private get gridLineDashStyle(): string {
    if (this.setting && this.setting[0]) {
      return this.setting[0].gridLineDashStyle ?? this.defaultSetting.gridLineDashStyle;
    }
    return this.defaultSetting.gridLineDashStyle;
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

  private get gridEnabled(): boolean {
    if (this.setting && this.setting[0]) {
      return this.setting[0].gridLineWidth != 0;
    }
    return false;
  }
  private get enableSettingGridLine(): boolean {
    const isScatter: boolean = this.query.className == QuerySettingType.Scatter;
    const isBubble: boolean = this.query.className == QuerySettingType.Bubble;
    const isSpider: boolean = this.query.className == QuerySettingType.SpiderWeb;
    return isScatter || isBubble || isSpider;
  }

  private get prefixText(): string {
    return this.setting[0]?.prefix?.text ?? this.defaultSetting.prefixText;
  }

  private get postfixText(): string {
    return this.setting[0]?.postfix?.text ?? this.defaultSetting.postfixText;
  }

  created() {
    if (!this.setting) {
      this.handleRevert();
    }
  }

  private handleAxisEnabled(enabled: boolean) {
    return this.$emit('onChanged', 'xAxis[0].visible', enabled);
  }

  private handleCategoryFontChanged(newFont: string) {
    return this.$emit('onChanged', 'xAxis[0].labels.style.fontFamily', newFont);
  }

  private handleCategoryFontSizeChanged(newFontSize: string) {
    return this.$emit('onChanged', 'xAxis[0].labels.style.fontSize', newFontSize);
  }

  private handleCategoryColorChanged(newColor: string) {
    return this.$emit('onChanged', 'xAxis[0].labels.style.color', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, any> = new Map();
    settingAsMap.set('xAxis[0].visible', this.defaultSetting.visible);
    settingAsMap.set('xAxis[0].labels.style.fontFamily', this.defaultSetting.categoryFont);
    settingAsMap.set('xAxis[0].labels.style.fontSize', this.defaultSetting.categoryFontSize);
    settingAsMap.set('xAxis[0].labels.style.color', this.defaultSetting.categoryColor);
    settingAsMap.set('xAxis[0].gridLineWidth', this.defaultSetting.gridLineWidth);
    settingAsMap.set('xAxis[0].gridLineColor', this.defaultSetting.gridLineColor);
    settingAsMap.set('xAxis[0].gridLineDashStyle', this.defaultSetting.gridLineDashStyle);
    settingAsMap.set('xAxis[0].prefix.text', this.defaultSetting.prefixText);
    settingAsMap.set('xAxis[0].postfix.text', this.defaultSetting.postfixText);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleGridEnabled(enabled: boolean) {
    if (enabled) {
      return this.$emit('onChanged', 'xAxis[0].gridLineWidth', 1);
    } else {
      return this.$emit('onChanged', 'xAxis[0].gridLineWidth', 0);
    }
  }

  private handleGridLineWidthChanged(newWidth: number) {
    if (this.gridEnabled) {
      return this.$emit('onChanged', 'xAxis[0].gridLineWidth', newWidth);
    }
  }

  private handleGridColorChanged(newColor: string) {
    return this.$emit('onChanged', 'xAxis[0].gridLineColor', newColor);
  }

  private handleGridLineDashStyleChanged(newDashStyle: string) {
    return this.$emit('onChanged', 'xAxis[0].gridLineDashStyle', newDashStyle);
  }

  private get gridLineChildrenSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.gridEnabled && this.enabled),
      marginBottom: '16px'
    } as CSSStyleDeclaration;
  }

  private get axisSettingStyle(): CSSStyleDeclaration {
    return {
      ...enableCss(this.enabled)
    } as CSSStyleDeclaration;
  }

  private handlePrefixSaved(newText: string) {
    return this.$emit('onChanged', 'xAxis[0].prefix.text', newText);
  }

  private handlePostfixSaved(newText: string) {
    return this.$emit('onChanged', 'xAxis[0].postfix.text', newText);
  }
}
</script>

<style lang="scss" scoped></style>
