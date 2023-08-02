<template>
  <div :class="{ 'disabled-setting': disable }" class="slider-setting no-gutters">
    <div class="d-flex flex-row align-items-center">
      <p v-if="label != null" class="m-0">{{ label }}</p>
      <span v-if="showHint" class="di-icon-help ml-2" v-b-tooltip.auto="hint"></span>
    </div>
    <div class="d-flex align-items-center">
      <BFormInput
        ref="displayInput"
        :number="true"
        type="number"
        :max="max"
        :min="0"
        :value="displayValue"
        class="slider-value"
        @blur="handleDisplayValueChange"
        @keydown.enter="handleDisplayValueChange"
      />
      <DiSlider class="slider" :value="displayValue" :id="id" :min="min" :max="max" @onChanged="handleValueChanged" />
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import DiSlider from '@/shared/components/common/di-slider/DiSlider.vue';
import { Log } from '@core/utils';
import { toNumber } from 'lodash';
import { BFormInput } from 'bootstrap-vue';
import { StringUtils } from '@/utils';

@Component({
  components: { DiSlider }
})
export default class SliderSetting extends Vue {
  @Ref()
  displayInput?: BFormInput;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  @Prop({ required: false, type: String })
  private readonly label!: string;

  @Prop({ required: true })
  private readonly value!: number;

  @Prop({ required: true })
  private readonly min!: number;

  @Prop({ required: true })
  private readonly max!: number;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ type: String, default: '' })
  private readonly hint!: string;

  private displayValue = this.value.toString();

  handleDisplayValueChange(event: any) {
    this.displayInput?.blur();
    const value = toNumber(event.target?.value);
    if (value > this.max) {
      this.setDisplayInputValue(this.max.toString());
      this.$emit('onChanged', this.max);
    } else if (value < this.min) {
      this.setDisplayInputValue(this.min.toString());
      this.$emit('onChanged', this.min);
    } else {
      this.setDisplayInputValue(value.toString());
      this.$emit('onChanged', value);
    }
  }

  setDisplayInputValue(value: string) {
    //@ts-ignore
    this.displayInput?.$el?.value = value;
    this.displayValue = value;
  }

  private handleValueChanged(newValue: number) {
    this.setDisplayInputValue(newValue.toString());
    Log.debug('settingSlider::handleValueChanged::', newValue);
    this.$emit('onChanged', newValue);
  }

  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.slider-setting {
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  .label {
    @include regular-text12-unselect();
    //cursor: pointer !important;
    opacity: 0.6;
    padding: 0;
    margin: 0;
  }

  .slider-value {
    width: 42px;
    height: 34px;
    margin-right: 12px;
    background-color: var(--secondary);
    text-align: center !important;
  }
}
</style>
