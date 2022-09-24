<template>
  <RangeSlider :class="sliderClass" :fixFrom="true" :fixTo="true" :from="0" :max="100" :min="0" :to="100" type="number" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import RangeSlider from '@/shared/components/Common/DiSlider/RangeSlider/RangeSlider.vue';
import { SlicerOptionData } from '@core/domain';

@Component({ components: { RangeSlider } })
export default class SlicerPreview extends Vue {
  @Prop({ type: Object, required: false })
  readonly setting!: SlicerOptionData;

  private get sliderClass(): string {
    const fromClass = this.fromEqual ? 'from-equal' : '';
    const toClass = this.toEqual ? 'to-equal' : '';
    return `range-slider-preview ${fromClass} ${toClass}`;
  }

  private get fromEqual(): boolean {
    return this.setting?.from?.equal ?? false;
  }

  private get toEqual(): boolean {
    return this.setting?.to?.equal ?? false;
  }
}
</script>

<style lang="scss">
.range-slider-preview {
  margin-top: 4px;

  .from,
  .to {
    height: 24px !important;
    width: 24px !important;
  }

  .irs-line {
    top: 10px !important;
  }

  .irs-bar {
    top: 10px !important;
  }

  &.from-equal {
    .from {
      border-radius: 4px !important;
    }
  }

  &.to-equal {
    .to {
      border-radius: 4px !important;
    }
  }
}
</style>
