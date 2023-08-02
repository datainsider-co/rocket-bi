<template>
  <PanelHeader header="Header" target-id="header-tab">
    <DropdownSetting
      id="font-family"
      :enabledRevert="false"
      :options="fontOptions"
      :value="tab.extraData.header.fontFamily"
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
    </div>
    <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { FilterPanel, TabWidget, TabWidgetOptions } from '@core/common/domain';
import { set } from 'lodash';
import { FontFamilyOptions, FontSizeOptions } from '@/shared/settings/common/options';

@Component({ components: { PanelHeader } })
export default class FilterPanelHeaderTab extends Vue {
  readonly fontSizeOptions = FontSizeOptions;
  readonly fontOptions = FontFamilyOptions;
  @PropSync('widget')
  tab!: TabWidget;

  private get defaultSetting(): TabWidgetOptions {
    return FilterPanel.defaultSetting();
  }

  private handleFontChanged(font: string) {
    set(this.tab, 'extraData.header.fontFamily', font);
  }

  private handleTabColorChanged(color: string) {
    set(this.tab, 'extraData.header.color', color);
  }

  private handleFontSizeChanged(size: string) {
    set(this.tab, 'extraData.header.fontSize', size);
  }
  private handleRevert() {
    set(this.tab, 'extraData.header', this.defaultSetting.header);
  }
}
</script>
