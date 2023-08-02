<template>
  <div class="percentage-input">
    <input class="percentage-input--input" ref="percentageInput" type="text" :value="currentValue" />
    <div class="percentage-input--actions">
      <button class="percentage-input--actions--up-button" @click="handleCountUp">
        <img src="@/assets/icon/input-number-up.svg" alt="" />
      </button>
      <div class="percentage-input--actions--divider"></div>
      <button class="percentage-input--actions--down-button" @click="handleCountDown">
        <img src="@/assets/icon/input-number-down.svg" alt="" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Model, Prop, Vue, Ref } from 'vue-property-decorator';
import { Log } from '@core/utils';

@Component
export default class PercentageInput extends Vue {
  @Prop({ required: true, type: String })
  private value!: string;

  private currentValue = this.value;
  public setCurrentValue(number: number) {
    this.percentageInput.value = number + '%';
  }

  @Ref()
  percentageInput!: HTMLInputElement;

  emitValue(value: number) {
    this.$emit('input', value);
    Log.debug('PercentageInput::emitValue::', value);
  }

  mounted() {
    this.percentageInput.value = this.value + '%';
    this.percentageInput.addEventListener('input', this.handleInput);
    this.percentageInput.addEventListener('blur', this.handleBlur);
  }

  private handleCountUp() {
    const value = this.getValue(`${parseInt(this.percentageInput.value) + 1}`);
    this.percentageInput.value = value + '%';
  }

  private handleCountDown() {
    const value = this.getValue(`${parseInt(this.percentageInput.value) - 1}`);
    this.percentageInput.value = value + '%';
  }

  private handleInput(e: any) {
    Log.debug('PercentageInput::handleInput::event::', e);

    if (e.data) {
      const newInt = e.target.value.slice(0, e.target.value.length - 1);
      const notDigitRegex = new RegExp('[^\\d]');
      if (notDigitRegex.test(e.data)) {
        e.target.value = newInt.replace(notDigitRegex, '') + '%';
        e.target.setSelectionRange(e.target.value.length - 1, e.target.value.length - 1);
        Log.debug('PercentageInput::handleInput::caseNotNumber::result:: ', e.target.value);
      } else {
        if (!e.target.value.includes('%')) {
          e.target.value = e.target.value + '%';
          e.target.setSelectionRange(e.target.value.length - 1, e.target.value.length - 1);
        } else {
          e.target.value = e.target.value.replace('%', '') + '%';
        }
      }
    } else {
      if (!e.target.value.includes('%')) {
        e.target.value = e.target.value + '%';
        e.target.setSelectionRange(e.target.value.length - 1, e.target.value.length - 1);
      } else {
        e.target.value = e.target.value.replace('%', '') + '%';
      }
    }
    this.emitValue(this.getValue(e.target.value));
  }

  private getValue(stringValue: string) {
    const value = parseInt(stringValue);
    if (isNaN(value)) {
      return 0;
    } else {
      if (value === 0) {
        return 0;
      } else if (value > 100) {
        return 100;
      } else {
        return value;
      }
    }
  }

  private handleBlur() {
    const value = this.getValue(this.percentageInput.value);
    Log.debug('PercentageInput::handleBlur::input::', value);
    this.percentageInput.value = value + '%';
    this.emitValue(value);
  }
}
</script>

<style lang="scss">
.percentage-input {
  height: 38px;
  width: 161px;
  position: relative;

  &:hover .percentage-input--input {
    outline: 2px solid #0066ff !important;
  }

  &--input {
    border-radius: 4px;
    border: 0;
    outline: 1px solid #c4cdd5;
    background: #fff;
    height: 100%;
    width: 100%;
    padding: 0 12px;

    &:focus,
    &:hover {
      outline: 2px solid #0066ff !important;
    }
  }
  &--actions {
    display: flex;
    flex-direction: column;
    position: absolute;
    right: 0;
    top: 0;
    height: 38px;
    width: 24px;

    &--divider {
      padding-top: 1px;
      background: #c4cdd5;
    }

    &--up-button,
    &--down-button {
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(50% - 0.5px);
      flex: 1;
      padding: 0;
      border: 0;

      background: #fff;
      border-left: 1px solid #c4cdd5;

      &:hover {
        background: #f4f6f8;
      }
    }

    &--up-button {
      border-top-right-radius: 4px;
    }

    &--down-button {
      border-bottom-right-radius: 4px;
    }
  }
}
</style>
