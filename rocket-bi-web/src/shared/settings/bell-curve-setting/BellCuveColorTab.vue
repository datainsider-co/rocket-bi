<template>
  <PanelHeader header="Data Color" target-id="color-tab">
    <div class="color-tab">
      <ToggleSetting
        id="color-theme-enable"
        :value="enabled"
        class="mb-3 group-config"
        :label="`${configSetting['color.auto.enabled'].label}`"
        :hint="`${configSetting['color.auto.enabled'].hint}`"
        @onChanged="handleThemeColorEnabled"
      />
      <div class="row-config-container">
        <ColorSetting
          id="palette-color-0"
          :default-color="defaultColors[0]"
          :value="paletteZeroColor"
          label="Color 1"
          size="half"
          :disable="enabled"
          style="margin-right: 12px"
          @onChanged="handlePaletteZeroColorChanged"
        />
        <ColorSetting
          id="palette-color-1"
          :default-color="defaultColors[1]"
          :value="paletteOneColor"
          label="Color 2"
          size="half"
          :disable="enabled"
          @onChanged="handlePaletteOneColorChanged"
        />
      </div>
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { SettingKey, ThemeColor } from '@core/common/domain';
import { _ThemeStore } from '@/store/modules/ThemeStore';

@Component({ components: { PanelHeader } })
export default class BellCurveColorTab extends Vue {
  private readonly configSetting = window.chartSetting['color.tab'];

  @Prop({ type: Object, required: false })
  private setting?: ThemeColor;
  private readonly defaultColors = _ThemeStore.paletteColors;

  private get paletteZeroColor(): string {
    return this.setting?.colors ? this.setting.colors[0] : this.defaultColors[0];
  }

  private get paletteOneColor(): string {
    return this.setting?.colors ? this.setting.colors[1] : this.defaultColors[1];
  }

  private get enabled(): boolean {
    return this.setting?.enabled ?? true;
  }

  private handlePaletteZeroColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[0]', newColor);
  }

  private handlePaletteOneColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[1]', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('themeColor.enabled', false);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleThemeColorEnabled(enabled: boolean) {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('themeColor.enabled', enabled);
    if (!enabled) {
      settingAsMap.set('themeColor.colors[0]', this.paletteZeroColor);
      settingAsMap.set('themeColor.colors[1]', this.paletteOneColor);
    }
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
