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
        :value="textInput"
        autocomplete="off"
        @input="onTextInputChanged"
        @blur.native="handleUnFocusInput"
        @keydown.enter="handleSave"
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
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
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
  private readonly id!: string;
  @Prop({ required: false, type: String })
  private readonly label!: string;
  @Prop({ required: true })
  private readonly value!: string;

  @Prop({ default: SettingSize.full })
  private readonly size!: SettingSize;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: false, type: String, default: '' })
  private readonly placeholder!: string;

  @Prop({ required: false, default: InputType.Text })
  private readonly type!: InputType;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly autoFocus!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly applyFormatNumber!: boolean;

  @Prop({ required: false, type: Number })
  private readonly min?: number;

  @Prop({ required: false, type: Number })
  private readonly max?: number;

  @Prop({ required: false, type: Number })
  private readonly maxLength?: number;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly suggestions!: string[];
  @Prop({ type: String, default: '' })
  private readonly hint!: string;

  @Ref()
  private readonly input?: BFormInput;

  private textInput = '';

  private isShowSuggestList = false;

  private get useFormatter(): boolean {
    return this.type === InputType.Number && this.applyFormatNumber;
  }

  // if use format for number, input must be a text
  private get currentType(): string {
    if (this.useFormatter) {
      return InputType.Text;
    } else {
      return this.type;
    }
  }

  private get isNotEmptyData(): boolean {
    return ListUtils.isNotEmpty(this.filteredData);
  }

  private get filteredData(): string[] {
    return this.suggestions.filter(label => label.toLowerCase().includes(this.textInput.toLowerCase()));
  }

  mounted() {
    this.textInput = this.formatValue(this.value || '');
  }

  setTextInput(value: string) {
    this.textInput = this.formatValue(value);
  }

  displaySuggest(show: boolean) {
    this.isShowSuggestList = show;
  }

  @Watch('value')
  private onValueChanged(newValue: string): void {
    if (this.textInput !== this.parseNumber(newValue)?.toString()) {
      this.textInput = this.formatValue(newValue);
    }
  }

  private handleSave() {
    // this.input?.blur();
    const showSuggest = false;
    this.displaySuggest(showSuggest);
    return this.emitValueChanged(this.textInput);
  }

  private formatValue(value: string): string {
    if (this.useFormatter && this.canFormat(value)) {
      const valueAsNumber = this.parseNumber(value) ?? this.textInput;
      return StringUtils.formatDisplayNumber(valueAsNumber, '', 'en-US', { maximumFractionDigits: 10 });
    } else {
      return value;
    }
  }

  private onTextInputChanged(value: string) {
    Log.debug('onTextInputChanged:', this.disable, value);
    const newValue = this.formatValue(value);
    this.textInput = newValue;
    const showSuggest = true;
    this.displaySuggest(showSuggest);
    this.updateCursor(value, newValue);
  }

  private updateCursor(currentValue: string, newValue: string) {
    if (this.useFormatter && this.input) {
      const offsetStart = currentValue.length - this.input.selectionStart;
      const positionStart = Math.max(newValue.length - offsetStart, 0);
      const positionEnd = Math.max(newValue.length - offsetStart, 0);
      this.setCursor(positionStart, positionEnd);
    }
  }

  private setCursor(start: number, end: number) {
    const setSelectionRange = () => {
      if (this.input) {
        const inputEl = this.input.$el as HTMLInputElement;
        // // force update value
        inputEl.value = this.textInput;
        inputEl.setSelectionRange(start, end);
      }
    };
    setSelectionRange();
    setTimeout(setSelectionRange, 1); // Android Fix
  }

  private canFormat(value: string): boolean {
    if (StringUtils.isNotEmpty(value)) {
      return this.isMultiDot(value) || (!value.endsWith('.') && value !== '-');
    } else {
      return false;
    }
  }

  // multi dot is case 0.11.. and 0..
  private isMultiDot(value: string) {
    return /(\d+\.\d+.+$)|(\.{2,})/.test(value);
  }

  private parseNumber(value: string): number | undefined {
    // remove character is not a number
    let numberAsText = value.replace(/[^(\-\d.)]+/g, '');
    // remove double (dot, minus)
    numberAsText = numberAsText.replace(/[.-]{2,}/g, '');

    if (StringUtils.isNumberPattern(numberAsText)) {
      return NumberUtils.toNumber(numberAsText);
    }
  }

  private handleUnFocusInput() {
    const showSuggest = false;
    this.displaySuggest(showSuggest);
    return this.emitValueChanged(this.textInput);
  }

  @Emit('onChanged')
  private emitValueChanged(value: string) {
    if (this.canValidateValue(value)) {
      const valueAsNumber = this.parseNumber(value);
      return this.getValidValue(valueAsNumber) ?? '';
    } else {
      return value;
    }
  }

  private canValidateValue(value: string) {
    return StringUtils.isNotEmpty(value) && (this.type === InputType.Number || this.useFormatter);
  }

  private getValidValue(valueAsNumber?: number | null): number | undefined {
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

  private suggestionInputSize() {
    return this.$el?.clientWidth ?? 500;
  }

  private handleSelectSuggest(text: string) {
    this.onTextInputChanged(text);
    this.handleSave();
  }
  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }

  private get isLabel(): boolean {
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
