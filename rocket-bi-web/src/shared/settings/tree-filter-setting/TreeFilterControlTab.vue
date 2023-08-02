<template>
  <PanelHeader ref="panel" header="Tree controls" target-id="tree-tab">
    <div>
      <div class="row-config-container">
        <ColorSetting
          id="de-active-color"
          :default-color="defaultSetting.deActiveColor"
          :value="deactivateColor"
          :label="`${configSetting['inActive.background'].label}`"
          :hint="`${configSetting['inActive.background'].hint}`"
          size="half"
          style="margin-right: 12px"
          @onChanged="handleDeActivateColorChanged"
        />
        <ColorSetting
          id="active-color"
          :default-color="defaultSetting.activeColor"
          :value="activeColor"
          :label="`${configSetting['active.background'].label}`"
          :hint="`${configSetting['active.background'].hint}`"
          size="half"
          @onChanged="handleActivateColorChanged"
        />
      </div>
      <!--      <DropdownSetting-->
      <!--        id="choice-font-family"-->
      <!--        :enabledRevert="false"-->
      <!--        :options="fontOptions"-->
      <!--        :value="choiceFont"-->
      <!--        class="mb-3"-->
      <!--        :label="`${configSetting['item.style.fontFamily'].label}`"-->
      <!--        :hint="`${configSetting['item.style.fontFamily'].hint}`"-->
      <!--        size="full"-->
      <!--        @onChanged="handleChoiceFontChanged"-->
      <!--      />-->
      <!--      <div class="row-config-container">-->
      <!--        <ColorSetting-->
      <!--          id="choice-font-color"-->
      <!--          :default-color="defaultSetting.choice.style.color"-->
      <!--          :value="choiceColor"-->
      <!--          :label="`${configSetting['item.style.color'].label}`"-->
      <!--          :hint="`${configSetting['item.style.color'].hint}`"-->
      <!--          size="small"-->
      <!--          style="margin-right: 12px"-->
      <!--          @onChanged="handleChoiceColorChanged"-->
      <!--        />-->
      <!--        <DropdownSetting-->
      <!--          id="choice-font-size"-->
      <!--          :options="fontSizeOptions"-->
      <!--          :value="choiceSize"-->
      <!--          :label="`${configSetting['item.style.fontSize'].label}`"-->
      <!--          :hint="`${configSetting['item.style.fontSize'].hint}`"-->
      <!--          size="small"-->
      <!--          style="margin-right: 16px"-->
      <!--          @onChanged="handleChoiceFontSizeChanged"-->
      <!--        />-->
      <!--      </div>-->
      <DefaultValueSetting
        :setting="setting.default"
        :title="`${configSetting['default.set'].label}`"
        :hint="`${configSetting['default.set'].hint}`"
        @onReset="handleResetDefaultValue"
        @onSaved="handleSetDefaultValue"
      />
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { SettingKey, TabOptionData, TreeFilterOption } from '@core/common/domain';
import { ChartType, Direction, SelectOption, TabFilterDisplay } from '@/shared';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { FlexAlignOptions } from '@/shared/settings/common/options/AlignOptions';
import DiButton from '@/shared/components/common/DiButton.vue';
import DiShadowButton from '@/shared/components/common/DiShadowButton.vue';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import DefaultValueSetting from '@/shared/settings/tab-filter-setting/DefaultValueSetting.vue';
import { FontFamilyOptions, FontSizeOptions } from '@/shared/settings/common/options';

@Component({ components: { DefaultValueSetting, DiIconTextButton, DiShadowButton, DiButton, PanelHeader } })
export default class TreeFilterControlTab extends Vue {
  private readonly configSetting = window.chartSetting['tabControl.tab'];

  @Prop({ required: false, type: Object })
  setting?: TabOptionData;

  @Prop({ required: false, default: ChartType.MultiTreeFilter })
  widgetType!: ChartType;
  @Ref()
  private panel!: PanelHeader;

  private defaultSetting = TreeFilterOption.getDefaultChartOption(this.widgetType).options;

  private get activeColor(): string {
    return this.setting?.activeColor ?? this.defaultSetting.activeColor ?? '';
  }

  private get deactivateColor(): string {
    return this.setting?.deActiveColor ?? this.defaultSetting.deActiveColor ?? '';
  }

  mounted() {
    this.panel.expand();
  }

  private handleActivateColorChanged(newColor: string) {
    return this.$emit('onChanged', 'activeColor', newColor);
  }

  private handleDeActivateColorChanged(newColor: string) {
    return this.$emit('onChanged', 'deActiveColor', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number | null> = new Map();
    settingAsMap.set('activeColor', this.defaultSetting.activeColor ?? '');
    settingAsMap.set('deActiveColor', this.defaultSetting.deActiveColor ?? '');
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleSetDefaultValue(value: any) {
    this.$emit('onChanged', 'default.setting', value);
    this.$emit('onDefaultChanged', value);
  }

  private handleResetDefaultValue() {
    this.$emit('onChanged', 'default.setting', null);
    this.$emit('onDefaultChanged', null);
  }

  // private get fontSizeOptions(): SelectOption[] {
  //   return FontSizeOptions;
  // }
  //
  // private get fontOptions(): SelectOption[] {
  //   return FontFamilyOptions;
  // }
  //
  // private get choiceFont(): string{
  //   return this.setting?.choice?.style?.fontFamily ?? '';
  // }
  //
  // private get choiceSize(): string{
  //   return this.setting?.choice?.style?.fontSize ?? '';
  // }
  //
  // private get choiceColor(): string{
  //   return this.setting?.choice?.style?.color ?? '';
  // }
}
</script>
