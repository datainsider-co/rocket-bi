<!--<template>-->
<!--  <div class="d-flex flex-column">-->
<!--    <div class="d-flex flex-row mb-2">-->
<!--      <InputSetting id="min-input" :applyFormatNumber="true" :value="`${fromValue}`" class="mr-2 w-50" type="number" @onChanged="handleMinInputChanged" />-->
<!--      <InputSetting id="max-input" :applyFormatNumber="true" :value="`${toValue}`" class="w-50" type="number" @onChanged="handleMaxInputChanged" />-->
<!--    </div>-->
<!--    <div class="d-flex flex-row">-->
<!--      <RangeSlider-->
<!--        :class="sliderClass"-->
<!--        :from="fromValue"-->
<!--        :max="max"-->
<!--        :min="min"-->
<!--        :step="step"-->
<!--        :to="toValue"-->
<!--        type="number"-->
<!--        @change="handleChangeCompleted"-->
<!--        @update:from="updateMinValue"-->
<!--        @update:to="updateMaxValue"-->
<!--      />-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import { Component, Prop, Vue, Watch } from 'vue-property-decorator';-->
<!--import RangeSlider from '@/shared/components/Common/DiSlider/RangeSlider/RangeSlider.vue';-->
<!--import { toNumber } from 'lodash';-->
<!--import { SlicerRange } from '@/shared';-->

<!--@Component({ components: { RangeSlider } })-->
<!--export default class NumberSlicer extends Vue {-->
<!--  @Prop({ type: Object, required: true })-->
<!--  readonly range!: SlicerRange;-->

<!--  @Prop({ type: Number, required: true })-->
<!--  readonly max!: number;-->

<!--  @Prop({ type: Number, required: true })-->
<!--  readonly min!: number;-->

<!--  @Prop({ type: Number, default: 1 })-->
<!--  readonly step!: number;-->

<!--  private toValue = this.range.to.value;-->

<!--  private fromValue = this.range.from.value;-->

<!--  private toEqual = this.range.to.equal;-->

<!--  private fromEqual = this.range.from.equal;-->

<!--  private get sliderClass(): string {-->
<!--    const fromClass = this.fromEqual ? 'from-equal' : '';-->
<!--    const toClass = this.toEqual ? 'to-equal' : '';-->
<!--    return `range-slider ${fromClass} ${toClass}`;-->
<!--  }-->

<!--  @Watch('range')-->
<!--  handleRangeChanged() {-->
<!--    this.toValue = this.range.to.value;-->
<!--    this.fromValue = this.range.from.value;-->
<!--    this.toEqual = this.range.to.equal;-->
<!--    this.fromEqual = this.range.from.equal;-->
<!--  }-->

<!--  private updateMinValue(value: string) {-->
<!--    const fromValueAsNumber: number = toNumber(value);-->
<!--    if (fromValueAsNumber > this.toValue) {-->
<!--      this.fromValue = this.toValue;-->
<!--    } else {-->
<!--      this.fromValue = fromValueAsNumber;-->
<!--    }-->
<!--  }-->

<!--  private updateMaxValue(value: string) {-->
<!--    const toValueAsNumber: number = toNumber(value);-->
<!--    if (toValueAsNumber < this.fromValue) {-->
<!--      this.toValue = this.fromValue;-->
<!--    } else {-->
<!--      this.toValue = toValueAsNumber;-->
<!--    }-->
<!--  }-->

<!--  private handleChangeCompleted(data: { from: number; to: number }) {-->
<!--    const { from, to } = data;-->
<!--    this.updateMinValue(`${from}`);-->
<!--    this.updateMaxValue(`${to}`);-->
<!--    this.emitValue();-->
<!--  }-->

<!--  private handleMinInputChanged(min: string) {-->
<!--    this.updateMinValue(min);-->
<!--    this.emitValue();-->
<!--  }-->

<!--  private handleMaxInputChanged(max: string) {-->
<!--    this.updateMaxValue(max);-->
<!--    this.emitValue();-->
<!--  }-->

<!--  private emitValue() {-->
<!--    const newRange: SlicerRange = {-->
<!--      from: {-->
<!--        value: this.fromValue,-->
<!--        equal: this.fromEqual-->
<!--      },-->
<!--      to: {-->
<!--        value: this.toValue,-->
<!--        equal: this.toEqual-->
<!--      }-->
<!--    };-->
<!--    this.$emit('change', newRange);-->
<!--  }-->

<!--  private toggleFromEqual() {-->
<!--    this.fromEqual = !this.fromEqual;-->
<!--    this.emitValue();-->
<!--  }-->

<!--  private toggleToEqual() {-->
<!--    this.toEqual = !this.toEqual;-->
<!--    this.emitValue();-->
<!--  }-->
<!--}-->
<!--</script>-->

<!--<style lang="scss">-->
<!--@import '~@/themes/scss/mixin.scss';-->

<!--.range-slider {-->
<!--  margin-top: 2px;-->

<!--  .from,-->
<!--  .to {-->
<!--    height: 16px !important;-->
<!--    width: 16px !important;-->
<!--  }-->

<!--  &.from-equal {-->
<!--    .from {-->
<!--      border-radius: 4px !important;-->
<!--    }-->
<!--  }-->

<!--  &.to-equal {-->
<!--    .to {-->
<!--      border-radius: 4px !important;-->
<!--    }-->
<!--  }-->
<!--}-->
<!--</style>-->
