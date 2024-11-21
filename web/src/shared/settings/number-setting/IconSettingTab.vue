<template>
  <PanelHeader header="Icon" target-id="icon-setting-tab">
    <div class="icon-setting-tab">
      <ToggleSetting label="Show icon" id="icon-setting-enabled" :value="enabled" class="group-config" @onChanged="handleEnableIconSetting" />
      <div :class="CSSClass">
        <IconPicker
          ref="iconPicker"
          class="icon-picker"
          iconPickerHeight="100%"
          :selected-icon="selectedIcon"
          :selected-icon-color="selectedIconColor"
          @selectIcon="handleChangeIcon"
          @selectIconColor="handleChangeIconColor"
        ></IconPicker>
        <IconBorderSetting
          ref="iconBorderSetting"
          :border-color="borderColor"
          :border-radius="borderRadius"
          :background="background"
          @changeIconBackground="handleChangeIconBackground"
          @changeBorderRadius="handleSelectBorderRadius"
        />
      </div>

      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { KPITheme, NumberOptionData, SettingKey } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { Log } from '@core/utils';
import IconPicker from '@/shared/components/icon-picker/IconPicker.vue';
import IconBorderSetting from '@/shared/components/icon-picker/IconBorderSetting.vue';

@Component({ components: { PanelHeader, IconPicker, IconBorderSetting } })
export default class IconSettingTab extends Vue {
  private readonly configSetting = window.chartSetting['icon.tab'];
  private readonly themeSettings = require('./themeSettings.json');
  private defaultTheme = KPITheme.Style1;

  @Prop({ required: false, type: Object })
  private readonly setting!: NumberOptionData;

  private get defaultSetting() {
    return this.themeSettings[this.setting.theme ?? this.defaultTheme].icon;
  }

  private get CSSClass() {
    if (this.enabled) {
      return '';
    } else {
      return 'disabled-setting';
    }
  }

  private get enabled() {
    return this.setting.icon?.enabled ?? false;
  }

  private get selectedIcon() {
    return this.setting.icon?.iconClass ?? this.defaultSetting.iconClass;
  }

  private get selectedIconColor() {
    return this.setting.icon?.color ?? this.defaultSetting.color;
  }

  private get borderColor() {
    return this.setting.icon?.borderColor ?? this.defaultSetting.borderColor;
  }

  private get borderRadius() {
    return this.setting.icon?.border ?? this.defaultSetting.border;
  }

  private get background() {
    return this.setting.icon?.background ?? this.defaultSetting.background;
  }

  private handleEnableIconSetting(value: boolean) {
    Log.debug('IconSettingTab::handleEnableIconSetting::enabled::', this.enabled);
    if (!this.setting.icon?.iconClass) {
      this.$emit('onChanged', 'icon', this.defaultSetting);
    } else {
      this.$emit('onChanged', 'icon.enabled', value);
    }
  }

  private handleChangeIcon(iconClass: string) {
    this.$emit('onChanged', 'icon.iconClass', iconClass);
  }

  private handleChangeIconColor(color: string) {
    this.$emit('onChanged', 'icon.color', color);
  }

  private handleChangeIconBackground(color: string) {
    this.$emit('onChanged', 'icon.background', color);
  }

  private handleSelectBorderRadius(value: string) {
    this.$emit('onChanged', 'icon.border', value);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set(`icon.iconClass`, this.defaultSetting.iconClass);
    settingAsMap.set(`icon.color`, this.defaultSetting.color);
    settingAsMap.set(`icon.border`, this.defaultSetting.border);
    settingAsMap.set(`icon.borderColor`, this.defaultSetting.borderColor);
    settingAsMap.set('icon.background', this.defaultSetting.background);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss">
.icon-setting-tab {
  .icon-picker {
    margin-top: 24px;
    icon-picker-container--tab--border {
      margin-top: 24px;
    }
  }
}
</style>
