<template>
  <div class="widget-text-setting">
    <span class="widget-text-setting--subtitle">{{ placeholder }}</span>
    <div class="widget-text-setting--block">
      <div class="widget-text-setting--block--item widget-text-setting--block--font-family">
        <label>Font</label>
        <DiDropdown :data="fontOptions" append-at-root v-model="textStyle.fontFamily" label-props="displayName" value-props="id" border />
      </div>
      <div class="widget-text-setting--block--item widget-text-setting--block--font-size">
        <label>Font Size</label>
        <DiDropdown :data="fontSizeOptions" append-at-root v-model="textStyle.fontSize" label-props="displayName" value-props="id" border />
      </div>
      <div class="widget-text-setting--block--item widget-text-setting--block--font-weight">
        <label>Font Weight</label>
        <DiDropdown :data="fontWeightOptions" append-at-root v-model="textStyle.fontWeight" label-props="displayName" value-props="id" border />
      </div>
    </div>
    <div class="widget-text-setting--block">
      <FontStyleSetting
        title=""
        :isBold.sync="textStyle.isBold"
        :isItalic.sync="textStyle.isItalic"
        :isUnderline.sync="textStyle.isUnderline"
        class="mar-r-22"
      />
      <AlignSettingV2 title="" v-model="textStyle.textAlign"></AlignSettingV2>
    </div>
    <div class="widget-text-setting--block">
      <div class="widget-text-setting--block--item widget-text-setting--block--font-color">
        <label>Color</label>
        <ColorPickerV2 v-model="textStyle.color" :allowWatchValueChange="true" :default-color="defaultColor" />
      </div>
    </div>
    <div class="widget-text-setting--block">
      <div class="widget-text-setting--block--item widget-text-setting--block--font-color-opacity">
        <label>Opacity</label>
        <PercentageInput v-model="textStyle.colorOpacity" @enter="applySetting" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Model, Prop, Vue } from 'vue-property-decorator';
import { TextStyleSetting } from '@core/common/domain';
import { AtomicAction } from '@core/common/misc';
import FontStyleSetting from '@/screens/dashboard-detail/components/font-style-setting/FontStyleSetting.vue';
import AlignSettingV2 from '@/screens/dashboard-detail/components/align-setting/AlignSettingV2.vue';
import ColorPickerV2 from '@/shared/components/ColorPickerV2.vue';
import PercentageInput from '@/shared/components/PercentageInput.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { FontFamilyOptions, SecondaryFontSizeOptions, FontWeightOptions, PrimaryFontSizeOptions } from '@/shared/settings/common/options';
import { SelectOption } from '@/shared';

@Component({
  components: {
    FontStyleSetting,
    AlignSettingV2,
    ColorPickerV2,
    PercentageInput,
    DiDropdown
  }
})
export default class WidgetTextSetting extends Vue {
  @Model('change', { type: Object })
  private readonly textStyle!: TextStyleSetting;

  @Prop({ type: String, default: '' })
  private readonly placeholder!: string;

  @Prop({ type: String, default: '' })
  private readonly defaultColor!: string;

  protected get fontOptions(): SelectOption[] {
    return FontFamilyOptions.filter(item => item.data?.isDefault !== true);
  }

  protected get fontSizeOptions(): SelectOption[] {
    return SecondaryFontSizeOptions.filter(item => item.data?.isDefault !== true);
  }

  protected get fontWeightOptions(): SelectOption[] {
    return FontWeightOptions;
  }

  @Emit('applySetting')
  @AtomicAction()
  applySetting(): void {
    return void 0;
  }

  ensureSetting(): void {
    //
  }
}
</script>

<style lang="scss">
.widget-text-setting {
  &--subtitle {
    display: block;
    font-size: 14px;
    color: #8e8e93;
    font-style: normal;
    line-height: 132%;
    margin-bottom: 8px;
  }

  &--block {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 22px;

    &--item {
      margin-right: 20px;
      label {
        margin-bottom: 4px;
      }
    }

    &--font-family {
      width: 246px;
    }

    &--font-size {
      width: 111px;
    }

    &--font-weight {
      width: 111px;
    }

    &--font-color {
      width: 160px;
    }

    &--font-color-opacity {
      width: 162px;
    }

    //&--input {
    //  width: 160px;
    //}
  }
}
</style>
