<template>
  <PanelHeader ref="panel" header="Tab controls" target-id="data-point-tab">
    <DefaultValueSetting class="mb-3" :setting="setting.default" @onReset="handleResetDefaultValue" @onSaved="handleSetDefaultValue" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { DateFilterOptionData } from '@core/common/domain';
import DefaultValueSetting from '@/shared/settings/tab-filter-setting/DefaultValueSetting.vue';

@Component({ components: { PanelHeader, DiButton, DefaultValueSetting } })
export default class DateTabControl extends Vue {
  @Prop({ required: false, type: Object })
  setting?: DateFilterOptionData;

  private handleSetDefaultValue(value: any) {
    this.$emit('onChanged', 'default.setting', value);
  }

  private handleResetDefaultValue() {
    return this.$emit('onChanged', 'default.setting', null);
  }
}
</script>

<style lang="scss" scoped></style>
