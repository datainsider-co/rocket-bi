<template>
  <div :class="{ 'disabled-setting': disable }" class="setting-container input-setting dropdown-setting no-gutters">
    <div v-if="isLabel || showHint" class="d-flex flex-row align-items-center label">
      <p v-if="isLabel">{{ label }}</p>
      <span v-if="showHint" class="di-icon-help ml-2" v-b-tooltip.auto="hint"></span>
    </div>
    <b-input-group class="form-control">
      <!--      <InputNumber/>-->
      <b-form-input
        :id="genInputId(`${id}`)"
        ref="input"
        :class="`form-input ${size}`"
        :disabled="disable"
        :maxLength="maxLength"
        :placeholder="placeholder"
        :type="currentType"
        :value="curInputValue"
        autocomplete="off"
        @input="onTextInputChanged"
        @blur.native="applyValue"
        @keydown.enter="applyValue"
      />
    </b-input-group>
    <BPopover
      v-if="isNotEmptyData"
      :show.sync="isShowSuggestList"
      :target="genInputId(`${id}`)"
      custom-class="input-setting-suggest"
      placement="bottom"
      triggers="blur"
    >
      <div :style="{ width: `${suggestionInputSize()}px` }" class="listing-data overflow-hidden">
        <div class="status-widget">
          <vuescroll>
            <div class="vuescroll-body">
              <div v-for="(label, index) in filteredData" :key="index" class="item" @click="handleSelectSuggest(label)">
                {{ label }}
              </div>
            </div>
          </vuescroll>
        </div>
        <!--        <div v-else class="text-center">Not found database name</div>-->
      </div>
    </BPopover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { SettingSize } from '@/shared/settings/common/SettingSize';
import { BFormInput } from 'bootstrap-vue';
import { StringUtils } from '@/utils/StringUtils';
import { Log, NumberUtils } from '@core/utils';
import { isNumber } from 'lodash';
import { ListUtils } from '@/utils';

export enum InputType {
  Text = 'text',
  Number = 'number'
}

@Component
export default class InputSetting extends Vue {
  @Prop({ required: true, type: String })
  protected readonly id!: string;
  @Prop({ required: false, type: String })
  protected readonly label!: string;
  @Prop({ required: true })
  protected readonly value!: string;

  @Prop({ default: SettingSize.full })
  protected readonly size!: SettingSize;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly disable!: boolean;

  @Prop({ required: false, type: String, default: '' })
  protected readonly placeholder!: string;

  @Prop({ required: false, default: InputType.Text })
  protected readonly type!: InputType;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly autoFocus!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly applyFormatNumber!: boolean;

  @Prop({ required: false, type: Number })
  protected readonly min?: number;

  @Prop({ required: false, type: Number })
  protected readonly max?: number;

  @Prop({ required: false, type: Number })
  protected readonly maxLength?: number;

  @Prop({ required: false, type: Array, default: () => [] })
  protected readonly suggestions!: string[];
  @Prop({ type: String, default: '' })
  protected readonly hint!: string;

  @Ref()
  protected readonly input?: BFormInput;

  protected curInputValue = '';

  protected isShowSuggestList = false;

  protected get useFormatter(): boolean {
    return this.type === InputType.Number && this.applyFormatNumber;
  }

  // if use format for number, input must be a text
  protected get currentType(): string {
    if (this.useFormatter) {
      return InputType.Text;
    } else {
      return this.type;
    }
  }

  protected get isNotEmptyData(): boolean {
    return ListUtils.isNotEmpty(this.filteredData);
  }

  protected get filteredData(): string[] {
    return this.suggestions.filter(label => label.toLowerCase().includes(this.curInputValue.toLowerCase()));
  }

  mounted() {
    this.curInputValue = this.formatValue(this.value || '');
  }

  setTextInput(value: string): void {
    this.curInputValue = this.formatValue(value);
  }

  showSuggestion(isShow: boolean): void {
    this.isShowSuggestList = isShow;
  }

  @Watch('value')
  protected onValueChanged(newValue: string): void {
    if (this.curInputValue !== this.parseNumber(newValue)?.toString()) {
      this.curInputValue = this.formatValue(newValue);
    }
  }

  protected applyValue(): void {
    this.showSuggestion(false);
    this.emitChangedValue(this.curInputValue);
  }

  protected formatValue(value: string): string {
    if (this.useFormatter && this.canFormat(value)) {
      const valueAsNumber = this.parseNumber(value) ?? this.curInputValue;
      return StringUtils.formatDisplayNumber(valueAsNumber, '', 'en-US', { maximumFractionDigits: 10 });
    } else {
      return value;
    }
  }

  protected onTextInputChanged(value: string) {
    Log.debug('onTextInputChanged:', this.disable, value);
    const newValue = this.formatValue(value);
    this.curInputValue = newValue;
    this.showSuggestion(true);
    this.updateCursor(value, newValue);
  }

  protected updateCursor(currentValue: string, newValue: string) {
    if (this.useFormatter && this.input) {
      const offsetStart = currentValue.length - this.input.selectionStart;
      const positionStart = Math.max(newValue.length - offsetStart, 0);
      const positionEnd = Math.max(newValue.length - offsetStart, 0);
      this.setCursor(positionStart, positionEnd);
    }
  }

  protected setCursor(start: number, end: number) {
    const setSelectionRange = () => {
      if (this.input) {
        const inputEl = this.input.$el as HTMLInputElement;
        // // force update value
        inputEl.value = this.curInputValue;
        inputEl.setSelectionRange(start, end);
      }
    };
    setSelectionRange();
    setTimeout(setSelectionRange, 1); // Android Fix
  }

  protected canFormat(value: string): boolean {
    if (StringUtils.isNotEmpty(value)) {
      return this.isMultiDot(value) || (!value.endsWith('.') && value !== '-');
    } else {
      return false;
    }
  }

  // multi dot is case 0.11.. and 0..
  protected isMultiDot(value: string) {
    return /(\d+\.\d+.+$)|(\.{2,})/.test(value);
  }

  protected parseNumber(value: string): number | undefined {
    // remove character is not a number
    let numberAsText = value.replace(/[^(\-\d.)]+/g, '');
    // remove double (dot, minus)
    numberAsText = numberAsText.replace(/[.-]{2,}/g, '');

    if (StringUtils.isNumberPattern(numberAsText)) {
      return NumberUtils.toNumber(numberAsText);
    }
  }

  protected emitChangedValue(value: string): void {
    const finalValue = this.toFinalValue(value);
    if (this.value !== finalValue) {
      this.$emit('onChanged', finalValue);
    }
  }

  protected toFinalValue(value: string): number | string {
    if (this.isNeededValid(value)) {
      const valueAsNumber = this.parseNumber(value);
      return this.getValidValue(valueAsNumber) ?? '';
    } else {
      return value;
    }
  }

  protected isNeededValid(value: string) {
    return StringUtils.isNotEmpty(value) && (this.type === InputType.Number || this.useFormatter);
  }

  protected getValidValue(valueAsNumber?: number | null): number | undefined {
    if (isNumber(valueAsNumber)) {
      let currentValue = valueAsNumber;
      if (isNumber(this.min)) {
        currentValue = Math.max(this.min, currentValue);
      }
      if (isNumber(this.max)) {
        currentValue = Math.min(this.max, currentValue);
      }

      return currentValue;
    }
  }

  protected suggestionInputSize() {
    return this.$el?.clientWidth ?? 500;
  }

  protected handleSelectSuggest(text: string) {
    this.onTextInputChanged(text);
    this.applyValue();
  }
  protected get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }

  protected get isLabel(): boolean {
    return StringUtils.isNotEmpty(this.label);
  }
}
</script>

<style lang="scss">
.input-setting {
  .form-control {
    background-color: var(--tab-filter-dropdown-background);
    height: auto;

    &::placeholder {
      color: var(--secondary-text-color);
      opacity: 0.8;
    }

    input {
      color: var(--secondary-text-color);
      background: transparent;
    }
  }
}
.input-setting-suggest {
  position: absolute;
  background: none;
  max-width: unset;
  width: unset;
  .arrow {
    display: none;
  }
  .popover-body {
    padding: 0;
  }

  .listing-data {
    padding: 8px 0;
    //width: 350px;
    z-index: 100;
    margin-top: -10px;
    background: var(--primary);
    border-radius: 4px;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.16);
    color: var(--text-color);
    font-size: 14px;

    .vuescroll-body {
      max-height: 185px;

      .item {
        padding: 8px 0 8px 16px;
        font-size: 14px;
        cursor: pointer;
        &:hover {
          background: var(--secondary);
        }
      }
    }
  }
}
</style>
