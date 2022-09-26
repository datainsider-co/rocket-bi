<template>
  <PanelHeader header="Data Color" target-id="color-tab">
    <div class="color-tab">
      <ToggleSetting id="color-theme-enable" :value="enabled" class="mb-3 group-config" label="Auto" @onChanged="handleThemeColorEnabled" />
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
      <div class="row-config-container">
        <ColorSetting
          id="palette-color-2"
          :default-color="defaultColors[2]"
          :value="paletteTwoColor"
          label="Color 3"
          size="half"
          :disable="enabled"
          style="margin-right: 12px"
          @onChanged="handlePaletteTwoColorChanged"
        />
        <ColorSetting
          id="palette-color-3"
          :default-color="defaultColors[3]"
          :value="paletteThreeColor"
          label="Color 4"
          size="half"
          :disable="enabled"
          @onChanged="handlePaletteThreeColorChanged"
        />
      </div>
      <div class="row-config-container">
        <ColorSetting
          id="palette-color-4"
          :default-color="defaultColors[4]"
          :value="paletteFourColor"
          label="Color 5"
          size="half"
          :disable="enabled"
          style="margin-right: 12px"
          @onChanged="handlePaletteFourColorChanged"
        />
        <ColorSetting
          id="palette-color-5"
          :default-color="defaultColors[5]"
          :value="paletteFiveColor"
          label="Color 6"
          size="half"
          :disable="enabled"
          @onChanged="handlePaletteFiveColorChanged"
        />
      </div>
      <div class="row-config-container">
        <ColorSetting
          id="palette-color-6"
          :default-color="defaultColors[6]"
          :value="paletteSixColor"
          label="Color 7"
          size="half"
          :disable="enabled"
          style="margin-right: 12px"
          @onChanged="handlePaletteSixColorChanged"
        />
        <ColorSetting
          id="palette-color-7"
          :default-color="defaultColors[7]"
          :value="paletteSevenColor"
          label="Color 8"
          size="half"
          :disable="enabled"
          @onChanged="handlePaletteSevenColorChanged"
        />
      </div>
      <div class="row-config-container">
        <ColorSetting
          id="palette-color-8"
          :default-color="defaultColors[8]"
          :value="paletteEightColor"
          label="Color 9"
          size="half"
          :disable="enabled"
          style="margin-right: 12px"
          @onChanged="handlePaletteEightColorChanged"
        />
        <ColorSetting
          id="palette-color-9"
          :default-color="defaultColors[9]"
          :value="paletteNineColor"
          label="Color 10"
          size="half"
          :disable="enabled"
          @onChanged="handlePaletteNineColorChanged"
        />
      </div>
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { SettingKey, ThemeColor } from '@core/domain';
import { _ThemeStore } from '@/store/modules/ThemeStore';

@Component({ components: { PanelHeader } })
export default class ColorTab extends Vue {
  @Prop({ type: Object, required: false })
  private setting?: ThemeColor;
  private readonly defaultColors = _ThemeStore.paletteColors;

  private get paletteZeroColor(): string {
    return this.setting?.colors ? this.setting.colors[0] : this.defaultColors[0];
  }

  private get paletteOneColor(): string {
    return this.setting?.colors ? this.setting.colors[1] : this.defaultColors[1];
  }

  private get paletteTwoColor(): string {
    return this.setting?.colors ? this.setting.colors[2] : this.defaultColors[2];
  }

  private get paletteThreeColor(): string {
    return this.setting?.colors ? this.setting.colors[3] : this.defaultColors[3];
  }

  private get paletteFourColor(): string {
    return this.setting?.colors ? this.setting.colors[4] : this.defaultColors[4];
  }

  private get paletteFiveColor(): string {
    return this.setting?.colors ? this.setting.colors[5] : this.defaultColors[5];
  }

  private get paletteSixColor(): string {
    return this.setting?.colors ? this.setting.colors[6] : this.defaultColors[6];
  }

  private get paletteSevenColor(): string {
    return this.setting?.colors ? this.setting.colors[7] : this.defaultColors[7];
  }

  private get paletteEightColor(): string {
    return this.setting?.colors ? this.setting.colors[8] : this.defaultColors[8];
  }

  private get paletteNineColor(): string {
    return this.setting?.colors ? this.setting.colors[9] : this.defaultColors[9];
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

  private handlePaletteTwoColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[2]', newColor);
  }

  private handlePaletteThreeColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[3]', newColor);
  }

  private handlePaletteFourColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[4]', newColor);
  }

  private handlePaletteFiveColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[5]', newColor);
  }

  private handlePaletteSixColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[6]', newColor);
  }

  private handlePaletteSevenColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[7]', newColor);
  }

  private handlePaletteEightColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[8]', newColor);
  }

  private handlePaletteNineColorChanged(newColor: string) {
    return this.$emit('onChanged', 'themeColor.colors[9]', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('themeColor.enabled', true);
    settingAsMap.set('themeColor.colors[0]', this.defaultColors[0]);
    settingAsMap.set('themeColor.colors[1]', this.defaultColors[1]);
    settingAsMap.set('themeColor.colors[2]', this.defaultColors[2]);
    settingAsMap.set('themeColor.colors[3]', this.defaultColors[3]);
    settingAsMap.set('themeColor.colors[4]', this.defaultColors[4]);
    settingAsMap.set('themeColor.colors[5]', this.defaultColors[5]);
    settingAsMap.set('themeColor.colors[6]', this.defaultColors[6]);
    settingAsMap.set('themeColor.colors[7]', this.defaultColors[7]);
    settingAsMap.set('themeColor.colors[8]', this.defaultColors[8]);
    settingAsMap.set('themeColor.colors[9]', this.defaultColors[9]);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleThemeColorEnabled(enabled: boolean) {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('themeColor.enabled', enabled);
    if (!enabled) {
      settingAsMap.set('themeColor.colors[0]', this.paletteZeroColor);
      settingAsMap.set('themeColor.colors[1]', this.paletteOneColor);
      settingAsMap.set('themeColor.colors[2]', this.paletteTwoColor);
      settingAsMap.set('themeColor.colors[3]', this.paletteThreeColor);
      settingAsMap.set('themeColor.colors[4]', this.paletteFourColor);
      settingAsMap.set('themeColor.colors[5]', this.paletteFiveColor);
      settingAsMap.set('themeColor.colors[6]', this.paletteSixColor);
      settingAsMap.set('themeColor.colors[7]', this.paletteSevenColor);
      settingAsMap.set('themeColor.colors[8]', this.paletteEightColor);
      settingAsMap.set('themeColor.colors[9]', this.paletteNineColor);
    }
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
