<template>
  <div class="padding-and-border-setting">
    <label class="padding-and-border-setting--title"><strong>Padding</strong></label>
    <span class="padding-and-border-setting--subtitle">Padding is the space between the content inside the element and the outer boundary of the element.</span>
    <div class="padding-and-border-setting--block mar-b-22">
      <DiInputComponent v-model="widgetSetting.padding" class="padding-and-border-setting--block--input" border label="Padding (px)" @enter="applySetting" />
    </div>
    <label class="padding-and-border-setting--title"><strong>Border</strong></label>
    <span class="padding-and-border-setting--subtitle">Border is the outline surrounding the element with different border styles and colors.</span>
    <div class="padding-and-border-setting--block border-setting-block">
      <DiInputComponent
        v-model="widgetSetting.border.width"
        class="padding-and-border-setting--block--input mar-r-16"
        border
        label="Border width (px)"
        @enter="applySetting"
      >
        <template #suffix>
          <div class="border-setting-block--input--suffix">
            <i class="di-icon-stroke-weight"></i>
          </div>
        </template>
      </DiInputComponent>
      <div class="padding-and-border-setting--block--color mar-r-16">
        <label>Border color</label>
        <ColorPickerV2 v-model="widgetSetting.border.color" :allowWatchValueChange="true" />
      </div>
      <div class="padding-and-border-setting--block--opacity">
        <label>Border Opacity</label>
        <PercentageInput v-model="widgetSetting.border.colorOpacity" @enter="applySetting" />
      </div>
    </div>
    <div class="padding-and-border-setting--block radius-setting-block">
      <di-radius-input v-model="widgetSetting.border.radius" @enter="applySetting"></di-radius-input>
    </div>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { AbstractSettingComponent } from '@/screens/dashboard-detail/components/dashboard-setting-modal/AbstractSettingComponent';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import ColorPickerV2 from '@/shared/components/ColorPickerV2.vue';
import PercentageInput from '@/shared/components/PercentageInput.vue';
import IndependentCornerInput from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/IndependentCornerInput.vue';
import { WidgetSetting } from '@core/common/domain';
import DiRadiusInput from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/DiRadiusInput.vue';

@Component({
  components: { DiRadiusInput, PercentageInput, ColorPickerV2, DiInputComponent, IndependentCornerInput }
})
export default class PaddingAndBorderSetting extends AbstractSettingComponent {
  get widgetSetting(): WidgetSetting {
    return this.value.widgetSetting;
  }

  ensureSetting(): void {
    //
  }
}
</script>

<style lang="scss">
.padding-and-border-setting {
  &--title {
    font-size: 16px;
    display: block;
    margin: 0 0 8px;
    font-style: normal;
    line-height: 132%;
  }

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

    label {
      margin-bottom: 4px;
    }

    &--input {
      width: 160px;
    }
  }

  .border-setting-block {
    margin-bottom: 25px;

    > div {
      width: 160px;
    }

    &--input--suffix {
      height: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      border-left-width: 1px;
      border-left-style: solid;
      border-left-color: #c4cdd5;
      padding-left: 5px;
      padding-right: 5px;

      i {
        font-size: 12px;
      }
    }
  }

  .radius-setting-block {
    width: 354px;
  }
}
</style>
