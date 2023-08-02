<template>
  <PanelHeader header="Apply" target-id="footer-tab">
    <InputSetting
      id="footer-title-input"
      :value="tab.extraData.footer.apply.title"
      class="mb-3"
      :label="`Footer title`"
      :placeholder="`Input footer title...`"
      size="full"
      @onChanged="handleFooterTitleChanged"
    />
    <DropdownSetting
      id="footer-font-family"
      :enabledRevert="false"
      :options="fontOptions"
      :value="tab.extraData.footer.apply.fontFamily"
      label="Font family"
      size="full"
      @onChanged="handleFontChanged"
    />
    <div class="row-config-container mt-2">
      <ColorSetting
        id="footer-font-color"
        :default-color="defaultSetting.footer.apply.color"
        :value="tab.extraData.footer.apply.color"
        size="small"
        style="margin-right: 12px"
        @onChanged="handleFooterColorChanged"
      />
      <DropdownSetting
        id="footer-font-size"
        :options="fontSizeOptions"
        :value="tab.extraData.footer.apply.fontSize"
        size="small"
        style="margin-right: 16px"
        @onChanged="handleFontSizeChanged"
      />
      <AlignSetting id="footer-align" :value="tab.extraData.footer.align" @onChanged="handleAlignChanged" />
    </div>
    <ColorSetting
      label="Apply Background"
      id="footer-background-color"
      :default-color="defaultSetting.footer.apply.background"
      :value="tab.extraData.footer.apply.background"
      size="half"
      class="mb-2"
      @onChanged="handleFooterBackgroundChanged"
    />
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
export default class FilterPanelFooterTab extends Vue {
  readonly fontSizeOptions = FontSizeOptions;
  readonly fontOptions = FontFamilyOptions;

  @PropSync('widget')
  tab!: TabWidget;
  private get defaultSetting(): TabWidgetOptions {
    return FilterPanel.defaultSetting();
  }
  private handleAlignChanged(align: string) {
    set(this.tab, 'extraData.footer.align', align);
  }
  private handleFooterColorChanged(color: string) {
    set(this.tab, 'extraData.footer.apply.color', color);
  }
  private handleFooterBackgroundChanged(color: string) {
    set(this.tab, 'extraData.footer.apply.background', color);
  }

  private handleFontSizeChanged(fontSize: string) {
    set(this.tab, 'extraData.footer.apply.fontSize', fontSize);
  }

  private handleFontChanged(font: string) {
    set(this.tab, 'extraData.footer.apply.fontFamily', font);
  }

  private handleFooterTitleChanged(title: string) {
    set(this.tab, 'extraData.footer.apply.title', title);
  }

  private handleRevert() {
    set(this.tab, 'extraData.footer', this.defaultSetting.footer);
  }
}
</script>

<style lang="scss" scoped></style>
