<template>
  <div>
    <TitleTab :setting="control.options" @onChanged="handleSettingChanged" @onMultipleChanged="handleMultipleSettingChanged" />
    <InputControlTab
      :setting="control.options"
      @onChanged="handleSettingChanged"
      @onMultipleChanged="handleMultipleSettingChanged"
      @onSetDefault="handleSetDefault"
    />
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { DynamicConditionWidget, DynamicFunctionWidget, SettingKey } from '@core/common/domain';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import { Log, ObjectUtils } from '@core/utils';
import InputControlTab from '@/screens/dashboard-detail/components/widget-setting/input-control/InputControlTab.vue';

@Component({ components: { TitleTab, InputControlTab } })
export default class DynamicConditionSetting extends Vue {
  @PropSync('widget')
  control!: DynamicConditionWidget;

  private handleSettingChanged(key: string, value: boolean | string | number, reRender?: boolean) {
    ObjectUtils.set(this.control.options, key, value);
  }

  private handleMultipleSettingChanged(settings: Map<SettingKey, boolean | string | number>) {
    settings.forEach((value, key) => {
      ObjectUtils.set(this.control.options, key, value);
    });
  }

  private handleSetDefault(values: string[]) {
    this.control.setValues(values);
  }
}
</script>

<style lang="scss" scoped></style>
