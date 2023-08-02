<template>
  <input v-model="currentValue" :max="max" :min="min" :style="sliderStyle" class="di-slider" type="range" />
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from 'vue-property-decorator';
import { ChartUtils } from '@/utils';
import { MinMaxData } from '@core/common/domain';
import { Log } from '@core/utils';
import { toNumber } from 'lodash';

@Component
export default class DiSlider extends Vue {
  @Prop({ required: false, default: 10 })
  private readonly value!: number;

  @Prop({ required: false, type: String, default: '' })
  private readonly id!: string;

  @Prop({ required: false, type: [String, Number], default: 0 })
  private readonly min!: number;

  @Prop({ required: false, type: [String, Number], default: 100 })
  private readonly max!: number;

  private currentValue = this.value;

  private get sliderStyle(): any {
    const ratio = ChartUtils.calculateRatio(this.currentValue, new MinMaxData('', this.min, this.max));
    return {
      '--percentage': Math.floor(ratio * 100) + '%'
    };
  }

  @Watch('value')
  handleOnValueChange(newValue: number): void {
    if (newValue != this.currentValue) {
      this.currentValue = newValue;
    }
  }

  // @Emit('onChanged')
  // private emitValueChange(newValue: number): number {
  //   return newValue;
  //   // return this.currentValue;
  // }

  @Watch('currentValue')
  on(newValue: string) {
    Log.debug('onChangeDiSliderValue::', newValue, typeof newValue);
    this.$emit('onChanged', toNumber(newValue));
  }
}
</script>

<style lang="scss">
input[type='range'].di-slider {
  $accent: var(--accent);
  $neutral: var(--neutral);
  $percentage: var(--percentage);

  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, $accent 0%, $accent $percentage, $neutral $percentage, $neutral 100%);
  border-radius: 3px;
  height: 6px;
  outline: none;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;

  width: 100%;

  @mixin range-thumb {
    -webkit-appearance: none;
    appearance: none;
    background-color: var(--accent);
    border: 2px solid white;
    border-radius: 14px;
    box-sizing: border-box;
    cursor: pointer;
    height: 14px;
    width: 14px;
  }

  &::-webkit-slider-thumb {
    @include range-thumb();
  }

  &::-moz-range-thumb {
    @include range-thumb();
  }

  &::-ms-thumb {
    @include range-thumb();
  }
}
</style>
