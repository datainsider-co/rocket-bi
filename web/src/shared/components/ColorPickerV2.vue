<template>
  <div>
    <BPopover :show.sync="isShow" :target="id" placement="top" triggers="blur" custom-class="popover-color-picker-v2" boundary="window">
      <template>
        <div id="main-picker-area" class="main-picker-area" :class="{ 'gradient-picker': !isSolid }">
          <Sketch v-if="isSolid" v-model="colors" :presetColors="[]"></Sketch>
          <VueGpickr v-else v-model="gradient"></VueGpickr>
          <div class="extend-area">
            <div :id="genBtnId('color-picker-reset-default')" class="d-flex flex-row btn-reset btn-ghost align-items-center" @click.prevent="resetToDefault">
              <div class="user-select-none">Reset to default</div>
            </div>
            <div class="d-flex flex-row justify-content-center button-bar">
              <DiButton :id="genBtnId('color-picker-cancel')" border class="col-5 mr-auto" title="Cancel" @click="cancelPickColor" />
              <DiButton :id="genBtnId('color-picker-save')" primary class="col-5 " title="OK" @click.prevent="applyColor" />
            </div>
          </div>
        </div>
      </template>
    </BPopover>
    <template v-if="pickerType === PickerType.InputAndPreview">
      <DiButton :id="id" class="color-picker-v2-button" @click.prevent="toggleShowPicker">
        <div class="color-picker-v2-button--container">
          <img src="@/assets/icon/fill.svg" alt="fill icon" />
          <div tabindex="0" class="d-flex flex-row color-picker-v2-fill justify-content-center align-items-center cursor-pointer">
            <div class="color-preview-area" :style="{ background: currentColorAsHex }"></div>
          </div>
        </div>
      </DiButton>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Model, Prop, Vue, Watch } from 'vue-property-decorator';
// @ts-ignored
import { Sketch } from 'vue-color';
// @ts-ignored
import { VueGpickr, LinearGradient } from 'vue-gpickr';
import ClickOutside from 'vue-click-outside';
import { ColorUtils } from '@/utils/ColorUtils';
import { Log } from '@core/utils';

interface ObjectColor {
  source: 'hex' | 'hsl' | 'hsv' | 'rgba' | 'hex8';
  hex?: string;
  hex8?: string;
  hsl?: { h: number; s: number; l: number; a: number };
  hsv?: { h: number; s: number; v: number; a: number };
  rgba?: { r: number; g: number; b: number; a: number };
  a?: number;
}

export enum PickerType {
  InputAndPreview = 'input_preview',
  OnlyPreview = 'only_preview'
}

@Component({
  components: {
    Sketch: Sketch,
    VueGpickr: VueGpickr
  },
  directives: {
    ClickOutside
  }
})
export default class ColorPickerV2 extends Vue {
  protected readonly PickerType = PickerType;

  @Prop({ type: String, default: () => `color-picker-${Date.now()}` })
  protected readonly id!: string;

  @Prop({ required: false, type: String, default: PickerType.InputAndPreview })
  protected readonly pickerType!: PickerType;

  @Model('change', { type: String, default: '#ffffff' })
  protected readonly value!: string;

  @Prop({ type: String, default: '#ffffff' })
  protected readonly defaultColor!: string;

  @Prop({ type: Boolean, default: false })
  protected readonly allowValueNull!: boolean;

  @Prop({ type: Boolean, default: false })
  protected readonly allowWatchValueChange!: boolean;

  protected currentColor = '';

  protected colorInPopover = '';

  protected currentProcess: number | undefined = void 0;

  protected isShow = false;

  protected popupItem: Element | null = null;

  private get isSolid(): boolean {
    return !ColorUtils.isGradientColor(this.value);
  }
  protected get colors(): ObjectColor {
    if (this.currentColor?.length === 8) {
      return {
        source: 'hex',
        hex8: this.colorInPopoverAsHex
      };
    } else {
      return {
        source: 'hex',
        hex: this.colorInPopoverAsHex
      };
    }
  }

  protected set colors(newColors: ObjectColor) {
    if (newColors.a === 1) {
      this.colorInPopover = newColors.hex || '#ffffff';
    } else {
      this.colorInPopover = newColors.hex8 ?? newColors.hex ?? '#ffffff';
    }
  }

  private get gradient(): LinearGradient | null {
    if (!this.isSolid && ColorUtils.isGradientColor(this.colorInPopover)) {
      return new LinearGradient({ ...ColorUtils.parseGradient(this.colorInPopover) });
    }
    return null;
  }

  private set gradient(gradient: LinearGradient | null) {
    if (gradient) {
      const cssValue = gradient.toString();
      this.colorInPopover = cssValue;
    }
  }
  @Watch('currentColor')
  onValueChanged(newColor: string) {
    if (this.currentProcess) {
      clearTimeout(this.currentProcess);
    }
    this.currentProcess = window.setTimeout(() => {
      this.$emit('change', newColor);
    }, 150);
  }

  constructor() {
    super();
    this.colorInPopover = this.currentColor = this.getColorOrDefault();
  }

  protected getColorOrDefault(): string {
    if (this.allowValueNull) {
      return this.value || this.defaultColor || '#00000000';
    } else {
      return this.value || this.defaultColor || '#ffffff';
    }
  }

  @Watch('value')
  onDefaultColorChange() {
    if (this.allowWatchValueChange) {
      this.colorInPopover = this.currentColor = this.getColorOrDefault();
    }
  }

  @Watch('colorInPopover')
  handleColorInPopoverChange(newColor: string, oldColor: string) {
    if (oldColor.length === 9 && newColor.length === 9) {
      if (oldColor.substring(7, 9) === newColor.substring(7, 9)) {
        this.colorInPopover = newColor.substring(0, 7);
      }
    }
  }

  private toggleShowPicker() {
    this.isShow = !this.isShow;
  }

  private hidePicker() {
    this.isShow = false;
  }

  private applyColor() {
    this.hidePicker();
    this.currentColor = this.colorInPopover;
  }

  private resetToDefault() {
    this.colorInPopover = this.defaultColor;
  }

  private cancelPickColor() {
    this.colorInPopover = this.value;
    this.hidePicker();
  }

  private get colorInPopoverAsHex(): string {
    return ColorUtils.getColorFromCssVariable(this.colorInPopover);
  }
  protected get currentColorAsHex(): string {
    return ColorUtils.getColorFromCssVariable(this.currentColor);
  }
  protected set currentColorAsHex(newValue: string) {
    this.currentColor = newValue;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';
@import '~@/themes/scss/mixin.scss';

.popover-color-picker-v2 {
  background-color: transparent;
  padding: 0;
  max-width: 600px;
  box-shadow: var(--menu-shadow);

  ::v-deep {
    .popover-body {
      padding: 0;
      color: var(--text-color);

      .main-picker-area {
        background-color: var(--primary);
        border: solid 0.5px rgba(#ffffff, 0.1);
        border-radius: 4px;

        &.gradient-picker {
          .vue-gpickr {
            border-radius: unset;
            box-shadow: unset;
          }
        }

        .vc-sketch {
          border: none 0;
          box-shadow: none;
          background-color: unset;
          width: 280px;

          .vc-hue--horizontal,
          .vc-sketch-sliders {
            border-radius: 0;
          }

          .vc-alpha-picker,
          .vc-hue-picker {
            border-radius: 1px;
          }

          .vc-sketch-presets {
            display: none;
          }

          .vc-sketch-color-wrap {
            .vc-sketch-active-color {
              border-radius: 2px;
              box-shadow: inset 0 0 3px 0 rgba(0, 0, 0, 0.5);
            }

            .vc-checkerboard {
              border-radius: 4px;
            }
          }

          .vc-sketch-field {
            @include regular-text();
            color: var(--text-color);
            font-weight: normal;
            font-stretch: normal;
            font-style: normal;
            line-height: normal;
            letter-spacing: normal;
            text-align: center;

            .vc-editable-input {
              .vc-input__input {
                color: inherit;
                border-radius: 2px;
                background-color: $headerColor;
                padding-top: 4px !important;
                padding-bottom: 4px !important;
                font-size: 11px;
                box-shadow: none;
                -webkit-box-shadow: none;
              }
            }

            .vc-input__label {
              color: inherit;
            }

            span[id^='input__label__a']:after {
              content: 'lpha';
            }

            //.vc-sketch-field--double {
            //  .vc-editable-input {
            //    max-width: 90px;
            //  }
            //}
            //.vc-sketch-field--single {
            //  .vc-editable-input {
            //    max-width: 45px;
            //  }
            //}
          }
        }

        .extend-area {
          margin: 10px;
          box-sizing: border-box;

          .btn-reset {
            @include regular-text();
            border: 1px solid #d6d6d5 !important;
            font-size: 11px;
            text-align: center;
            padding: 5px;
            align-content: center;
            justify-content: center;
            margin-bottom: 10px;
          }

          .button-bar {
            max-height: 40px;

            .btn {
              padding: 4px 15px !important;
            }
          }
        }
      }
    }

    .arrow {
      display: none;
    }
  }
}
</style>

<style lang="scss">
.color-picker-v2-button {
  padding: 10px 14px 10px 10px;
  width: 100%;
  height: 40px;
  border-radius: 6px;
  margin-left: 1px;
  margin-right: 1px;
  box-shadow: 0 0 0 1px #d6d6d6;
  // avoid box-shadow overlap

  .regular-text-14 {
    padding-left: 0;
  }
  &:hover {
    box-shadow: 0 0 0 1px var(--accent);
  }

  &--container {
    display: flex;
    align-items: center;
    width: inherit;
    justify-content: space-evenly;

    img {
      margin-right: 12px;
    }

    .color-picker-v2-fill {
      border-bottom-right-radius: 4px;
      border-top-right-radius: 4px;
      background-color: var(--input-background-color);

      &::-webkit-color-swatch {
        border: none;
      }

      .color-preview-area {
        width: 22px;
        height: 22px;
        //border: 1px solid #D6D6D6;
        border-radius: 4px;
        border-style: solid;
        border-color: #d6d6d6;
        border-width: 0.5px;
      }
    }
  }
}
</style>
