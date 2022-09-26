<template>
  <PanelHeader header="stack" target-id="stack-area-tab">
    <div class="general-tab">
      <ToggleSetting id="stack-enable" :value="stackingEnabled" class="mb-3 group-config" label="Stack" @onChanged="handleStackEnabled" />
      <ToggleSetting
        id="stack-percentage"
        :value="stackingPercentage"
        class="mb-3"
        label="Percentage"
        :disable="!stackingEnabled"
        @onChanged="handlePercentage"
      />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SeriesOptionData } from '@core/domain';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { enableCss } from '@/shared/Settings/Common/install';

@Component({ components: { PanelHeader } })
export default class SeriesGeneralTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting?: SeriesOptionData;

  private get stackingEnabled(): boolean {
    switch (this.setting?.plotOptions?.area?.stacking) {
      case 'value':
      case 'percent':
        return true;
      default:
        return false;
    }
  }

  private get stackingPercentage(): boolean {
    return this.setting?.plotOptions?.area?.stacking == 'percent';
  }

  private handleStackEnabled(enable: boolean) {
    const stackValue = enable ? 'value' : undefined;
    return this.$emit('onChanged', 'plotOptions.area.stacking', stackValue);
  }

  private handlePercentage(enable: boolean) {
    const stackValue = enable ? 'percent' : 'value';
    return this.$emit('onChanged', 'plotOptions.area.stacking', stackValue);
  }
}
</script>

<style lang="scss" src="../Common/tab.style.scss" />
