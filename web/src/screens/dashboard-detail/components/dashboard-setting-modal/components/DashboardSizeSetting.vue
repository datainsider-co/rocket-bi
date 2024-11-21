<template>
  <div class="dashboard-size-setting">
    <div class="dashboard-size-setting--section">
      <label class="dashboard-size-setting--section--title"><strong>Dashboard Size</strong></label>
      <span class="dashboard-size-setting--section--subtitle">Please enter the dimensions WxH below.</span>
      <div class="dashboard-size-setting--section--block width-height-block">
        <DiInputDropdown
          v-model="value.size.width"
          :dropdownValue.sync="value.size.widthUnit"
          :dropdownOptions="unitOptions"
          class="width-height-block--input"
          placeholder="1000"
          autofocus
          border
          label="Width"
          @enter="applySetting"
        />
        <img src="@/assets/icon/vertical_link.svg" alt="link" />
        <DiInputComponent class="width-height-block--input" border label="Height" value="auto" disabled />
      </div>
      <div class="dashboard-size-setting--section--block corner-radius-block">
        <DiRadiusInput v-model="value.border.radius" @enter="applySetting" />
      </div>
    </div>
    <div class="dashboard-size-setting--section">
      <label class="dashboard-size-setting--section--title"><strong>Stroke</strong></label>
      <div class="dashboard-size-setting--section--block stroke-setting-block">
        <DiInputComponent v-model="border.width" class="stroke-setting-block--input" border label="Stroke Weight (px)" @enter="applySetting">
          <template #suffix>
            <div class="stroke-setting-block--input--suffix">
              <i class="di-icon-stroke-weight"></i>
            </div>
          </template>
        </DiInputComponent>
        <div class="stroke-setting-block--color">
          <label>Stroke color</label>
          <ColorPickerV2 v-model="border.color" :allowWatchValueChange="true" />
        </div>
        <div class="stroke-setting-block--opacity">
          <label>Stroke Opacity</label>
          <PercentageInput v-model="border.colorOpacity" @enter="applySetting" />
        </div>
        <div class="stroke-setting-block--position">
          <label>Stroke Position</label>
          <DiDropdown
            v-model="border.position"
            appendAtRoot
            border
            class="stroke-setting-block--position--dropdown"
            valueProps="value"
            :data="strokePositionOptions"
            placeholder="select position"
          ></DiDropdown>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import IndependentCornerInput from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/IndependentCornerInput.vue';
import { AbstractSettingComponent } from '@/screens/dashboard-detail/components/dashboard-setting-modal/AbstractSettingComponent';
import { BorderInfo, BorderPosition, SizeInfo, SizeUnit } from '@core/common/domain';
import { NumberUtils } from '@core/utils';
import DiInputDropdown from '@/shared/components/DiInputDropdown.vue';
import { Ref } from 'vue-property-decorator';
import DiRadiusInput from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/DiRadiusInput.vue';

@Component({
  // @ts-ignore
  components: { DiRadiusInput, DiInputComponent, IndependentCornerInput, DiInputDropdown }
})
export default class DashboardSizeSetting extends AbstractSettingComponent {
  protected get strokePositionOptions(): DropdownData[] {
    return [
      {
        label: 'Outside Stroke',
        value: BorderPosition.Outside
      },
      {
        label: 'Inside Stroke',
        value: BorderPosition.Inside
      },
      {
        label: 'Center Stroke',
        value: BorderPosition.Center
      }
    ];
  }

  protected get border(): BorderInfo {
    return this.value.border;
  }

  protected get size(): SizeInfo {
    return this.value.size;
  }

  protected get unitOptions(): DropdownData[] {
    return [
      {
        label: 'px',
        value: SizeUnit.px
      },
      {
        label: '%',
        value: SizeUnit.percent
      }
    ];
  }

  ensureSetting(): void {
    // throw new Error('Method not implemented.');
    // this.$v.$touch();
  }
}
</script>

<style lang="scss">
.dashboard-size-setting {
  &--section {
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
      flex-direction: row;
    }

    .width-height-block {
      &--input {
        width: 177px;
      }

      img {
        width: 24px;
        height: 24px;
        margin: auto 5px 7.5px;
      }

      margin-bottom: 22px;
    }

    .corner-radius-block {
      margin-bottom: 22px;
      width: 388px;
    }

    .stroke-setting-block {
      grid-column-gap: 16px;

      label {
        margin-bottom: 8px;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 109.023%; /* 15.263px */
      }

      > * {
        flex: 1;
      }

      &--input {
        &--suffix {
          //width: 26px;
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

      &--color {
      }

      &--position {
        padding-right: 1px;
      }

      margin-bottom: 12px;
    }
  }
}
</style>
