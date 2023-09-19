<template>
  <PanelHeader header="Background" target-id="background-tab">
    <div class="background-tab">
      <ColorSetting
        id="background-color"
        :default-color="defaultColor"
        :value="color"
        :is-solid="isSolid"
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
import { ColorUtils } from '@/utils';

@Component({ components: { PanelHeader } })
export default class BackgroundTab extends Vue {
  @Prop({ required: false, type: String, default: 'background' })
  private readonly settingKey!: string;

  @Prop({ required: false, type: String, default: '#ffffff' })
  private readonly color!: string;

  @Prop({ required: false, type: String, default: '#ffffff' })
  private readonly defaultColor!: string;

  private handleBackgroundColorChanged(newColor: string) {
    this.$emit('onChanged', this.settingKey, newColor);
  }

  private handleBackgroundRevert() {
    this.$emit('onChanged', this.settingKey, this.defaultColor);
  }

  private get isSolid(): boolean {
    return ColorUtils.isGradientColor(this.color);
  }
}
</script>

<style lang="scss" src="../TabStyle.scss" />
