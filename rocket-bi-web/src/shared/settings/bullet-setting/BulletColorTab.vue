<template>
  <PanelHeader header="Colors" target-id="bullet-color-tab">
    <div class="row-config-container">
      <ColorSetting
        id="range-1-color"
        :defaultColor="defaultSetting.range1Color"
        :value="range1Color"
        label="Range 1 Color"
        size="half"
        style="margin-right: 8px"
        @onChanged="handleRangeColor1Changed"
      />
      <ColorSetting
        id="range-2-color"
        :defaultColor="defaultSetting.range2Color"
        :value="range2Color"
        label="Range 2 Color"
        size="half"
        @onChanged="handleRangeColor2Changed"
      />
    </div>
    <ColorSetting
      id="range-3-color"
      :defaultColor="defaultSetting.range1Color"
      :value="range3Color"
      label="Range 3 Color"
      size="half"
      @onChanged="handleRangeColor3Changed"
    />
    <revert-button @click="handleRevert" />
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { get } from 'lodash';
import { SeriesOptionData, SettingKey } from '@core/common/domain';
import RevertButton from '@/shared/settings/common/RevertButton.vue';

@Component({ components: { PanelHeader, RevertButton } })
export default class BulletColorTab extends Vue {
  private readonly defaultSetting = {
    range1Color: '#75ABEA',
    range2Color: '#8ABCF8',
    range3Color: '#A9CBF4'
  };
  @Prop({ required: false, type: Object })
  private readonly setting!: SeriesOptionData;

  private get range1Color(): string {
    return get(this.setting, 'yAxis[0].plotBands[0].color', this.defaultSetting.range1Color);
  }

  private get range2Color(): string {
    return get(this.setting, 'yAxis[0].plotBands[1].color', this.defaultSetting.range2Color);
  }

  private get range3Color(): string {
    return get(this.setting, 'yAxis[0].plotBands[2].color', this.defaultSetting.range3Color);
  }

  private handleRangeColor1Changed(newColor: string) {
    this.$emit('onChanged', 'yAxis[0].plotBands[0].color', newColor);
  }

  private handleRangeColor2Changed(newColor: string) {
    this.$emit('onChanged', 'yAxis[0].plotBands[1].color', newColor);
  }

  private handleRangeColor3Changed(newColor: string) {
    this.$emit('onChanged', 'yAxis[0].plotBands[2].color', newColor);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number> = new Map();
    settingAsMap.set('yAxis[0].plotBands[0].color', this.defaultSetting.range1Color);
    settingAsMap.set('yAxis[0].plotBands[1].color', this.defaultSetting.range2Color);
    settingAsMap.set('yAxis[0].plotBands[2].color', this.defaultSetting.range3Color);
    this.$emit('onMultipleChanged', settingAsMap);
  }
}
</script>

<style lang="scss" scoped></style>
