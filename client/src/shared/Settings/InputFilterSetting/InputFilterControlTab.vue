<template>
  <PanelHeader ref="panel" header="Input controls" target-id="data-point-tab">
    <div class="data-point-tab">
      <DefaultValueSetting class="mb-2" :setting="setting.default" @onSaved="handleSetDefaultValue" @onReset="handleResetDefaultValue" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SettingKey, TabOptionData } from '@core/domain';
import { Direction, SelectOption, TabFilterDisplay } from '@/shared';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { FlexAlignOptions } from '@/shared/Settings/Common/Options/AlignOptions';
import DiButton from '@/shared/components/Common/DiButton.vue';
import DiShadowButton from '@/shared/components/Common/DiShadowButton.vue';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import DefaultValueSetting from '@/shared/Settings/TabFilterSetting/DefaultValueSetting.vue';

@Component({ components: { DefaultValueSetting, DiIconTextButton, DiShadowButton, DiButton, PanelHeader } })
export default class InputFilterControlTab extends Vue {
  @Prop({ required: false, type: Object })
  setting?: TabOptionData;
  private readonly defaultSetting = {};

  private handleSetDefaultValue(value: any) {
    this.$emit('onChanged', 'default.setting', value);
  }

  private handleResetDefaultValue() {
    return this.$emit('onChanged', 'default.setting', null);
  }
}
</script>
