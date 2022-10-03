<template>
  <div>
    <DropdownSetting
      id="position-setting"
      label="Position"
      :options="positionOptions"
      :value="tab.extraData.header.position"
      @onChanged="handlePositionChanged"
    />
    <DropdownSetting
      id="font-family"
      :enabledRevert="false"
      :options="fontOptions"
      :value="tab.extraData.header.fontFamily"
      class="mt-3"
      label="Font family"
      size="full"
      @onChanged="handleFontChanged"
    />
    <div class="row-config-container mt-2">
      <ColorSetting
        id="title-font-color"
        :default-color="defaultSetting.header.color"
        :value="tab.extraData.header.color"
        size="small"
        style="margin-right: 12px"
        @onChanged="handleTabColorChanged"
      />
      <DropdownSetting
        id="title-font-size"
        :options="fontSizeOptions"
        :value="tab.extraData.header.fontSize"
        size="small"
        style="margin-right: 16px"
        @onChanged="handleFontSizeChanged"
      />
      <!--            <AlignSetting id="title-align" :value="titleAlign" label="Alignment" @onChanged="handleTitleAlignChanged" />-->
    </div>
    <div class="row-config-container justify-content-between mt-3">
      <ColorSetting
        id="background-color-active-setting"
        :default-color="defaultSetting.header.active.background"
        label="Background active"
        :value="tab.extraData.header.active.background"
        size="half"
        @onChanged="handleBackgroundActiveChanged"
      />
      <ColorSetting
        id="background-color-inactive-setting"
        :default-color="defaultSetting.header.inActive.background"
        label="Background inactive"
        :value="tab.extraData.header.inActive.background"
        size="half"
        @onChanged="handleBackgroundInActiveChanged"
      />
    </div>
    <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync } from 'vue-property-decorator';
import { FontSizeOptions } from '@/shared/settings/common/options/FontSizeOptions';
import { FontFamilyOptions } from '@/shared/settings/common/options/FontFamilyOptions';
import { TabWidget, TabWidgetOptions } from '@core/common/domain';
import { set } from 'lodash';

@Component({ components: {} })
export default class TabWidgetSetting extends Vue {
  @PropSync('widget')
  tab!: TabWidget;

  readonly fontSizeOptions = FontSizeOptions;
  readonly fontOptions = FontFamilyOptions;

  readonly positionOptions = [
    {
      id: 'vertical',
      displayName: 'Vertical'
    },
    {
      id: 'horizontal',
      displayName: 'Horizontal'
    }
  ];

  private get defaultSetting(): TabWidgetOptions {
    return TabWidget.defaultSetting();
  }

  private handleFontChanged(font: string) {
    set(this.tab, 'extraData.header.fontFamily', font);
  }

  private handlePositionChanged(position: string) {
    set(this.tab, 'extraData.header.position', position);
  }

  private handleTabColorChanged(color: string) {
    set(this.tab, 'extraData.header.color', color);
  }

  private handleFontSizeChanged(size: string) {
    set(this.tab, 'extraData.header.fontSize', size);
  }

  private handleBackgroundActiveChanged(color: string) {
    set(this.tab, 'extraData.header.active.background', color);
  }
  private handleBackgroundInActiveChanged(color: string) {
    set(this.tab, 'extraData.header.inActive.background', color);
  }

  private handleRevert() {
    set(this.tab, 'extraData', this.defaultSetting);
  }
}
</script>

<style lang="scss" scoped></style>
