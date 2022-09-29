<template>
  <PanelHeader header="Collapsed And Expanded" target-id="collapse-tab">
    <div class="collapse-tab">
      <div class="row-config-container">
        <ColorSetting
          id="toggle-background-color"
          :default-color="defaultValue.background"
          :value="background"
          label="Background color"
          size="half"
          style="margin-right:12px"
          @onChanged="handleBackgroundColorChanged"
        />
        <ColorSetting
          id="toggle-icon-color"
          :default-color="defaultValue.color"
          :value="iconColor"
          label="Icon color"
          size="half"
          @onChanged="handleIconColorChanged"
        />
      </div>
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChartOption, PivotTableChartOption, SettingKey } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';

@Component({ components: { PanelHeader } })
export default class CollapseTab extends Vue {
  @Prop({ required: false, type: Object })
  private readonly setting!: PivotTableChartOption;
  private readonly defaultValue = {
    color: ChartOption.getThemeTextColor(),
    background: ChartOption.getTableToggleColor()
  };

  private get background() {
    return this.setting?.options?.toggleIcon?.backgroundColor ?? this.defaultValue.background;
  }

  private get iconColor() {
    return this.setting?.options?.toggleIcon?.color ?? this.defaultValue.color;
  }

  private handleBackgroundColorChanged(newColor: string) {
    this.$emit('onChanged', 'toggleIcon.backgroundColor', newColor);
  }

  private handleIconColorChanged(newColor: string) {
    this.$emit('onChanged', 'toggleIcon.color', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, any> = new Map();
    settingAsMap.set('toggleIcon.backgroundColor', this.defaultValue.background);
    settingAsMap.set('toggleIcon.color', this.defaultValue.color);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss" />
