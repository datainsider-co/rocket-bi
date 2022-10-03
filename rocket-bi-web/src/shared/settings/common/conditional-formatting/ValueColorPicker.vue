<template>
  <div class="value-color-picker">
    <template v-if="isShowToggleEnable">
      <ToggleSetting :id="`${id}-enabled`" :label="title" :value="value.enabled" @onChanged="handlePickerEnabled" />
    </template>
    <template v-else>
      <div class="color-picker-title">
        <p :title="title" class="label text-break">{{ title }}</p>
      </div>
    </template>
    <div :class="{ 'disabled-setting': disablePicker }" class="color-picker-body">
      <div class="color-picker-panel">
        <DropdownSetting :id="`${id}-type`" :options="options" :value="selectedOption" class="picker-type-select" @onChanged="selectOption" />
        <ColorPicker
          v-if="showColorPicker"
          :id="`${id}-picker`"
          :allowValueNull="true"
          :allowWatchValueChange="true"
          :defaultColor="defaultColor"
          :pickerType="PickerType.OnlyPreview"
          :value="value.color"
          @change="handleColorChanged"
        />
      </div>
      <InputSetting
        :id="`${id}-input`"
        :class="{ 'disabled-setting': disableInputColor, 'input-error': inputValueError }"
        :value="value.value"
        class="input-value-color"
        :placeholder="inputPlaceHolder"
        @onChanged="handleValueChanged"
        :type="InputType.Number"
        :min="min"
        :max="max"
        :disable="disableInputColor"
        applyFormatNumber
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { ValueColorFormatting, ValueColorFormattingType } from '@core/common/domain';
import { SelectOption } from '@/shared';
import { cloneDeep } from 'lodash';
import ColorPicker, { PickerType } from '@/shared/components/ColorPicker.vue';
import { NumberUtils } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';
import { InputType } from '@/shared/settings/common/InputSetting.vue';

@Component({
  components: { ColorPicker }
})
export default class ValueColorPicker extends Vue {
  private readonly PickerType = PickerType;
  private readonly InputType = InputType;
  @Prop({ required: false, type: String, default: '' })
  private readonly id!: string;
  @Prop({ required: true, type: String })
  private readonly title!: string;
  @Prop({ required: true, type: String })
  private readonly firstOptionLabel!: string;

  @Prop({ required: false, type: String, default: 'Enter a value' })
  private readonly inputPlaceHolder!: string;

  @Prop({
    required: true,
    default: () => {
      return {};
    }
  })
  private readonly value!: ValueColorFormatting;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowToggleEnable!: boolean;

  @Prop({ required: false, type: String, default: '#ffffff' })
  private readonly defaultColor!: string;

  @Prop({ required: false, type: Boolean, default: true })
  private showColorPicker!: boolean;

  @Prop({ required: false, type: Number })
  private readonly min?: number;

  @Prop({ required: false, type: Number })
  private readonly max?: number;

  private get options(): SelectOption[] {
    return [
      {
        id: ValueColorFormattingType.Default,
        displayName: this.firstOptionLabel
      },
      {
        id: ValueColorFormattingType.Custom,
        displayName: 'Custom'
      }
    ];
  }

  private get disablePicker(): boolean {
    return this.isShowToggleEnable && !this.value.enabled;
  }

  private get disableInputColor(): boolean {
    return !this.disablePicker && this.selectedOption === ValueColorFormattingType.Default;
  }

  get inputValueError(): boolean {
    const enableInputColor = !this.disableInputColor;
    const useCustomInput = this.selectedOption === ValueColorFormattingType.Custom;
    const number = NumberUtils.toNumber(this.value.value);
    const hasValue = StringUtils.isNotEmpty(this.value.value ?? null);
    return enableInputColor && useCustomInput && hasValue && isNaN(number);
  }

  private get selectedOption(): ValueColorFormattingType {
    return this.value.type ?? ValueColorFormattingType.Default;
  }

  private selectOption(type: ValueColorFormattingType): void {
    this.emitUpdateValue({
      type: type
    });
  }

  @Emit('update:value')
  private emitUpdateValue(updatedObject: ValueColorFormatting): ValueColorFormatting {
    const value = cloneDeep(this.value);
    return Object.assign(value, updatedObject);
  }

  private handlePickerEnabled(enabled: boolean) {
    this.emitUpdateValue({
      enabled: enabled
    });
  }

  private handleColorChanged(newColor: string): void {
    if (newColor != this.value.color) {
      this.emitUpdateValue({
        color: newColor
      });
    }
  }

  private handleValueChanged(newValue: number): void {
    this.emitUpdateValue({
      value: newValue.toString()
    });
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.value-color-picker {
  > .color-picker-title {
    align-items: center;
    display: flex;
    height: 27px;

    p.label {
      @include regular-text-14();
      color: var(--secondary-text-color);
      font-size: 12px;
      margin: 0 8px 0 0;
      padding: 0;
      -webkit-tap-highlight-color: rgba(34, 42, 66, 0);
    }
  }

  > .color-picker-body {
    margin-top: 8px;

    > .color-picker-panel {
      display: flex;

      > .picker-type-select {
        margin-bottom: 8px;
        margin-right: 8px;
        width: 136px;
      }
    }

    > .input-value-color {
      width: 136px;

      &.input-error {
        outline: 1px solid var(--danger);
        margin: 1px;
      }
    }
  }
}
</style>
