<template>
  <PanelHeader header="Background" target-id="background-tab">
    <div class="background-tab">
      <ColorSetting
        id="background-color"
        :default-color="defaultStyle.background"
        :value="background"
        enabledRevert="true"
        label="Color"
        size="small"
        class="mb-3"
        @onChanged="handleBackgroundColorChanged"
        @onRevert="handleBackgroundRevert"
      />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PivotTableChartOption, ChartOptionData, ChartOption } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { Log } from '@core/utils';

@Component({ components: { PanelHeader } })
export default class BackgroundTab extends Vue {
  private defaultStyle = {
    background: ChartOption.getThemeBackgroundColor()
  };
  @Prop({ required: false, type: Object })
  private readonly setting!: ChartOptionData;

  private get background() {
    return this.setting?.background ?? this.defaultStyle.background;
  }

  private handleBackgroundColorChanged(newColor: string) {
    this.$emit('onChanged', 'background', newColor);
  }
  private handleBackgroundRevert() {
    Log.debug('On reset');
    this.$emit('onChanged', 'background', this.defaultStyle.background);
  }
}
</script>

<style lang="scss" src="../TabStyle.scss" />
