<template>
  <div class="dashboard-color-setting">
    <label class="dashboard-color-setting--title"><strong>Dashboard Color</strong></label>
    <span class="dashboard-color-setting--subtitle">Please choose a single color or a gradient. </span>
    <div class="dashboard-color-setting--block">
      <div class="dashboard-color-setting--block--color">
        <label>Color</label>
        <ColorPickerV2 v-model="background.color" :allowWatchValueChange="true" />
      </div>
      <div class="dashboard-color-setting--block--opacity">
        <label>Opacity</label>
        <PercentageInput v-model="background.opacity" @enter="applySetting" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { AbstractSettingComponent } from '@/screens/dashboard-detail/components/dashboard-setting-modal/AbstractSettingComponent';
import ColorPickerV2 from '@/shared/components/ColorPickerV2.vue';
import PercentageInput from '@/shared/components/PercentageInput.vue';
import { BackgroundInfo } from '@core/common/domain';

@Component({
  components: {
    ColorPickerV2,
    PercentageInput
  }
})
export default class DashboardColorSetting extends AbstractSettingComponent {
  protected get background(): BackgroundInfo {
    return this.value.background;
  }

  ensureSetting(): void {
    //
  }
}
</script>

<style lang="scss">
.dashboard-color-setting {
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
    margin-bottom: 16px;
    font-style: normal;
    line-height: 132%;
  }

  &--block {
    display: flex;
    grid-column-gap: 16px;
    margin-bottom: 1px;

    &--color,
    &--opacity {
      width: 160px;

      label {
        margin-bottom: 8px;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 109.023%; /* 15.263px */
      }
    }
  }
}
</style>
