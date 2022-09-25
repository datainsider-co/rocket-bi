<template>
  <div class="setting-container no-gutters" v-click-outside="handleClickOutside">
    <div class="col-2 label text-break pt-2" style="text-align: right">{{ settingItem.name }}</div>
    <div class="col-10 w-100">
      <b-input-group class="form-control">
        <b-form-input
          :id="genInputId(`${settingItem.key}`)"
          v-model="value"
          type="text"
          autocomplete="off"
          @blur="handleUnFocusInput"
          @focus="handleFocusInput"
          @keydown.enter="handleSave"
          ref="input"
        />
      </b-input-group>
      <div v-if="containSettings" class="editor_actions mt-2 d-flex flex-row">
        <div v-if="containColorSetting" class="col-5 pl-0 pr-1 color-setting">
          <ColorPicker
            :id="genBtnId(`color-${settingItem.key}`)"
            :value="colorSetting.value"
            @change="handlePickColor"
            :allowValueNull="true"
            :allowWatchValueChange="true"
            :defaultColor="colorSetting.defaultValue"
          />
        </div>
        <div v-if="containFontSizeSetting" class="col-2 p-0">
          <DiDropdown
            :id="genDropdownId(`config-${settingItem.key}`)"
            class="selection"
            :data="fontSizeSetting.options"
            labelProps="displayName"
            valueProps="id"
            :value="fontSizeSetting.value"
            boundary="window"
            :appendAtRoot="false"
            :enableIconSelected="false"
            @selected="handleFontSizeSelect"
          ></DiDropdown>
        </div>
        <AlignComponent class="col-4 p-2" v-if="containAlignSetting" :settingItem="alignSetting" @change="handleAlignSelect" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';
import ClickOutside from 'vue-click-outside';
import { SelectOption, SettingItemType } from '@/shared';
import { Log } from '@core/utils';

@Component({
  directives: {
    ClickOutside
  }
})
export default class TextEditorComponent extends Vue {
  private currentValue: string | null = null;

  @Prop({ required: true })
  settingItem!: SettingItem;
  private isShowSaving = false;

  /*
   * Text setting
   */

  @Ref()
  private input!: HTMLInputElement;

  private get value(): string {
    return this.currentValue ?? this.settingItem.value;
  }

  private set value(newValue: string) {
    this.currentValue = newValue;
  }
  @Emit('onChanged')
  private handleSave() {
    this.input?.blur();
    this.$emit('onChanged', this.settingItem.key, this.value);
  }

  private handleFocusInput() {
    this.isShowSaving = true;
  }
  @Emit('onChanged')
  private handleUnFocusInput() {
    this.$emit('onChanged', this.settingItem.key, this.value);
  }

  private handleClickOutside() {
    // this.$emit('onChanged', this.settingItem.key, this.value);
    if (this.isShowSaving) {
      this.isShowSaving = false;
    }
  }
  private get containSettings(): boolean {
    return this.containAlignSetting || this.containColorSetting || this.containFontSizeSetting;
  }

  /*
   * Color setting
   */

  private get colorSetting(): SettingItem | undefined {
    return this.settingItem.innerSettingItems?.find(setting => setting.type == SettingItemType.color);
  }

  private get containColorSetting(): boolean {
    return this.colorSetting != undefined;
  }
  @Emit('onChanged')
  private handlePickColor(newColor: string): void {
    this.$emit('onChanged', this.colorSetting?.key, newColor);
  }

  /*
   * FontSize setting
   */

  private get fontSizeSetting(): SettingItem | undefined {
    return this.settingItem.innerSettingItems?.find(setting => setting.type == SettingItemType.selection);
  }

  private get containFontSizeSetting(): boolean {
    return this.fontSizeSetting != undefined;
  }
  @Emit('onChanged')
  private handleFontSizeSelect(item: SelectOption) {
    this.$emit('onChanged', this.fontSizeSetting?.key, item.id);
  }

  /*
   * Align setting
   */

  private get alignSetting(): SettingItem | undefined {
    return this.settingItem.innerSettingItems?.find(setting => setting.type == SettingItemType.align);
  }

  private get containAlignSetting(): boolean {
    return this.alignSetting != undefined;
  }
  @Emit('onChanged')
  private handleAlignSelect(newAlign: string) {
    this.$emit('onChanged', this.alignSetting?.key, newAlign);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
@import '~bootstrap/scss/bootstrap-grid';
@import '~@/themes/scss/_button.scss';

.setting-container {
  align-items: unset;
}
.input-group {
  input {
    padding: 10px 16px !important;

    @include media-breakpoint-down(lg) {
      padding: 5px 10px !important;
    }
  }

  .input-group-append {
    img {
      margin-right: 8px;
      padding: 8px;

      @include media-breakpoint-down(lg) {
        margin-right: 0;
        //padding: 8px;
      }
    }
  }
}

.editor_actions {
  height: 34px;

  .color-setting {
    ::v-deep {
      input {
        padding: 10px 4px 10px 8px;

        @include media-breakpoint-down(lg) {
          padding: 5px 10px;
        }
      }
    }
  }

  .selection {
    min-width: 40px;
    margin-top: 0;
    ::v-deep {
      button {
        height: 34px;
        padding: 4px;
        @media screen and (max-width: 1200px) {
          padding: 2px;
          > div {
            margin-right: 2px;
          }
        }

        @media screen and (min-width: 1200px) {
          padding: 4px;
          > div {
            margin-right: 4px;
          }
        }

        > span {
          padding-right: 0;
        }

        > div {
          height: 34px;
          width: 20px;
          margin-right: 2px;
        }
      }
    }
  }
}
</style>
