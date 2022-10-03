<template>
  <div class="color-scale-panel">
    <div :style="colorPreviewBarStyle" class="color-preview-bar"></div>
    <div class="color-picker-panel">
      <ValueColorPicker
        id="min-color"
        ref="minColor"
        :default-color="defaultColor.minColor"
        :value.sync="colorScale.min"
        first-option-label="Lowest value"
        title="Minimum"
        input-place-holder="Lowest value"
      />
      <ValueColorPicker
        id="center-color"
        ref="centerColor"
        :default-color="defaultColor.centerColor"
        :value.sync="colorScale.center"
        first-option-label="Middle value"
        is-show-toggle-enable
        title="Center"
        input-place-holder="Middle value"
      />
      <ValueColorPicker
        id="max-color"
        ref="maxColor"
        :default-color="defaultColor.maxColor"
        :value.sync="colorScale.max"
        first-option-label="Highest value"
        title="Maximum"
        input-place-holder="Highest value"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Ref, Vue } from 'vue-property-decorator';
import { ColorScale } from '@core/common/domain';
import ValueColorPicker from '@/shared/settings/common/conditional-formatting/ValueColorPicker.vue';

@Component({
  components: { ValueColorPicker }
})
export default class ColorScalePanel extends Vue {
  @Ref()
  private readonly minColor?: ValueColorPicker;
  @Ref()
  private readonly centerColor?: ValueColorPicker;
  @Ref()
  private readonly maxColor?: ValueColorPicker;

  @PropSync('color', { required: true })
  private readonly colorScale!: ColorScale;
  private defaultColor = {
    minColor: '#d2f4ff',
    maxColor: '#2d95ff',
    centerColor: '#e5ff85'
  };

  private get colorPreviewBarStyle() {
    return {
      backgroundImage: this.getBackgroundColor(this.colorScale)
    };
  }

  validate(): boolean {
    const isMinColorError = this.minColor?.inputValueError ?? true;
    const isMaxColorError = this.maxColor?.inputValueError ?? true;
    const isCenterColorError = this.centerColor?.inputValueError ?? true;
    return !(isMinColorError || isCenterColorError || isMaxColorError);
  }

  private getBackgroundColor(colorScale: ColorScale): string {
    const minColor = colorScale.min?.color ?? this.defaultColor.minColor;
    const maxColor = colorScale.max?.color ?? this.defaultColor.maxColor;
    if (colorScale.center?.enabled) {
      const centerColor = colorScale.center.color ?? this.defaultColor.centerColor;
      return `linear-gradient(to right, ${minColor}, ${centerColor} 47%, ${maxColor})`;
    } else {
      return `linear-gradient(to right, ${minColor}, ${maxColor})`;
    }
  }
}
</script>

<style lang="scss">
div .color-scale-panel {
  > .color-preview-bar {
    border: var(--menu-background-color);
    height: 24px;
    margin-bottom: 16px;
  }

  > .color-picker-panel {
    display: flex;
    flex-direction: row;

    > div + div {
      margin-left: 12px;
    }

    > div {
      flex: 1;
    }
  }
}
</style>
