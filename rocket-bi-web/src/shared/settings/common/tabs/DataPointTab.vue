<template>
  <PanelHeader ref="panel" header="general" target-id="data-point-tab">
    <div class="data-point-tab">
      <InputSetting
        id="data-point"
        :value="dataPoint"
        class="mb-3 group-config"
        :label="`${configSetting['maxDataPoint'].label}`"
        :hint="`${configSetting['maxDataPoint'].hint}`"
        :placeholder="`${configSetting['maxDataPoint'].placeHolder}`"
        size="full"
        @onChanged="handleDataPointChanged"
      />
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SeriesOptionData } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';

@Component({ components: { PanelHeader } })
export default class DataPointTab extends Vue {
  private readonly configSetting = window.chartSetting['general.tab'];

  @Prop({ required: false, type: Object })
  setting!: SeriesOptionData;

  private get dataPoint(): string {
    return this.setting?.numDataPoint ? `${this.setting?.numDataPoint}` : '1000';
  }

  private handleDataPointChanged(newValue: string) {
    return this.$emit('onChangeAndQuery', 'numDataPoint', newValue);
  }

  private handleRevert() {
    return this.$emit('onChangeAndQuery', 'numDataPoint', '1000');
  }
}
</script>

<style lang="scss"></style>
