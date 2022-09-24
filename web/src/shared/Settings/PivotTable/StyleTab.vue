<template>
  <PanelHeader ref="panel" header="Style" target-id="style-tab">
    <div class="style-tab">
      <DropdownSetting
        id="font-family"
        :options="themeOptions"
        :value="theme"
        class="mb-3 group-config"
        enabledRevert="true"
        label="Select style"
        size="full"
        @onChanged="handleFontChanged"
        @onRevert="handleRevert"
      />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { PivotTableChartOption, SettingKey } from '@core/domain';
import { SelectOption } from '@/shared';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { SettingTheme } from '@/shared/Settings/Common/SettingTheme';
import { _ThemeStore, DiTheme } from '@/store/modules/ThemeStore';

@Component({ components: { PanelHeader } })
export default class StyleTab extends Vue {
  private readonly themAsMap: Record<DiTheme, SettingTheme[]> = require('./TableTheme.json');

  @Prop({ required: false, type: Object })
  private readonly setting!: PivotTableChartOption;

  @Ref()
  private panel!: PanelHeader;

  private get themes(): SettingTheme[] {
    return this.themAsMap[_ThemeStore.currentThemeName] || [];
  }

  private get theme(): string {
    return this.setting?.options?.theme ?? 'default';
  }

  private get themeOptions(): SelectOption[] {
    return this.themes.map(theme => ({ displayName: theme.name, id: theme.key }));
  }

  mounted() {
    this.panel.expand();
  }

  private handleFontChanged(newValue: string) {
    const settingAsMap = this.buildSettingToChange(newValue);
    return this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleRevert() {
    const settingAsMap = this.buildSettingToChange('default');
    return this.$emit('onMultipleChanged', settingAsMap);
  }

  private buildSettingToChange(newValue: string): Map<SettingKey, boolean | string | number> {
    const selectedTheme = this.themes.find(theme => theme.key == newValue);
    if (selectedTheme) {
      const settingAsMap = this.buildBasicSetting(selectedTheme);
      return new Map([...settingAsMap]);
    }
    return new Map();
  }

  private buildBasicSetting(theme: SettingTheme): Map<SettingKey, any> {
    const settings = new Map<SettingKey, boolean | string | number>();
    settings.set('theme', theme.key);
    for (const setting in theme.settings) {
      const value = theme.settings[setting];
      settings.set(setting, value);
    }
    return settings;
  }
}
</script>

<style lang="scss" src="../Common/tab.style.scss"></style>
