<template>
  <PanelHeader ref="panel" header="Input controls" target-id="data-point-tab">
    <div class="data-point-tab">
      <InputSetting
        id="placeholder-input"
        placeholder="Input Hint"
        :value="placeHolder"
        class="mb-3"
        label="Hint text"
        size="full"
        @onChanged="handlePlaceHolderSaved"
      />
      <DefaultValueSetting class="mb-2" :setting="setting.default" @onSaved="handleSetDefaultValue" @onReset="handleResetDefaultValue" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { InputOptionData, SettingKey, TabOptionData } from '@core/domain';
import { Direction, SelectOption, TabFilterDisplay } from '@/shared';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { FlexAlignOptions } from '@/shared/Settings/Common/Options/AlignOptions';
import DiButton from '@/shared/components/Common/DiButton.vue';
import DiShadowButton from '@/shared/components/Common/DiShadowButton.vue';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import DefaultValueSetting from '@/shared/Settings/TabFilterSetting/DefaultValueSetting.vue';

@Component({ components: { DefaultValueSetting, DiIconTextButton, DiShadowButton, DiButton, PanelHeader } })
export default class InputControlTab extends Vue {
  @Prop({ required: false, type: Object })
  setting?: InputOptionData;
  private readonly defaultSetting = {};

  private handleSetDefaultValue(tempValue: any) {
    this.$emit('onChanged', 'default.setting', tempValue);
    this.$emit('onSetDefault', tempValue.value ?? ['']);
  }

  private handleResetDefaultValue() {
    this.$emit('onChanged', 'default.setting', null);
    this.$emit('onSetDefault', ['']);
  }

  private handlePlaceHolderSaved(text: string) {
    return this.$emit('onChanged', 'placeHolder', text);
  }

  private get placeHolder(): string {
    return this.setting?.placeHolder ?? '';
  }
}
</script>
