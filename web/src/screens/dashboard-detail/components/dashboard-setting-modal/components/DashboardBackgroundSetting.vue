<template>
  <div class="dashboard-background-setting">
    <label class="dashboard-background-setting--title"><strong>Background Dashboard</strong></label>
    <span class="dashboard-background-setting--subtitle">Select an image and adjust the parameters accordingly.</span>
    <div class="dashboard-background-setting--image">
      <div v-if="backgroundImage.path" class="dashboard-background-setting--image--preview" :title="backgroundImage.imageName || backgroundImage.path">
        <span>{{ backgroundImage.imageName || backgroundImage.path }}</span>
        <div class="dashboard-background-setting--image--preview--icon" @click="onClickRemoveImage">
          <i class="di-icon-delete"></i>
        </div>
      </div>
      <DiButton v-else class="dashboard-background-setting--image--upload" title="Upload Image" border @click="onClickUploadImage">
        <i class="di-icon-image"></i>
      </DiButton>
    </div>
    <div class="dashboard-background-setting--section fit-mode-setting">
      <label class="dashboard-background-setting--section--title">Fit Mode</label>
      <DiDropdown
        class="dashboard-background-setting--section--dropdown"
        placeholder="Select fit mode"
        append-at-root
        border
        v-model="backgroundImage.fitMode"
        :data="fitModeOptions"
        value-props="value"
      ></DiDropdown>
    </div>
    <div class="dashboard-background-setting--section">
      <label class="dashboard-background-setting--section--title">Brightness</label>
      <DiSlider v-model="backgroundImage.brightness" :min="0" :max="100"></DiSlider>
    </div>
    <div class="dashboard-background-setting--section">
      <label class="dashboard-background-setting--section--title">Contrast</label>
      <DiSlider v-model="backgroundImage.contrast" :min="0" :max="100"></DiSlider>
    </div>
    <div class="dashboard-background-setting--section">
      <label class="dashboard-background-setting--section--title">Gray-scale</label>
      <DiSlider v-model="backgroundImage.grayscale" :min="0" :max="100"></DiSlider>
    </div>
    <div class="dashboard-background-setting--section">
      <label class="dashboard-background-setting--section--title">Opacity</label>
      <DiSlider v-model="backgroundImage.opacity" :min="0" :max="100"></DiSlider>
    </div>
    <ImageBrowserModal ref="imageBrowserModal" />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { AbstractSettingComponent } from '@/screens/dashboard-detail/components/dashboard-setting-modal/AbstractSettingComponent';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { BackgroundImageInfo, FitMode } from '@core/common/domain';
import DiSlider from '@/shared/components/common/di-slider/DiSlider.vue';
import ImageBrowserModal from '@/screens/dashboard-detail/components/upload/ImageBrowserModal.vue';
import { Ref } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils';

@Component({
  components: { DiSlider, DiDropdown, DiInputComponent, ImageBrowserModal }
})
export default class DashboardBackgroundSetting extends AbstractSettingComponent {
  @Ref()
  protected readonly imageBrowserModal!: ImageBrowserModal;

  protected get backgroundImage(): BackgroundImageInfo {
    return this.value.backgroundImage;
  }

  protected get fitModeOptions(): DropdownData[] {
    return Object.entries(FitMode)
      .map(([key, value]) => {
        return {
          label: StringUtils.camelToCapitalizedStr(key),
          value: value
        };
      })
      .sort((a, b) => StringUtils.compare(a.label, b.label));
  }

  ensureSetting(): void {
    //
  }

  protected onClickUploadImage(): void {
    this.imageBrowserModal.show((newUrl: string) => {
      Log.debug('newUrl', newUrl);
      this.backgroundImage.path = newUrl;
    }, 'Upload Image');
  }

  onClickRemoveImage(): void {
    this.backgroundImage.path = '';
    this.backgroundImage.imageName = '';
  }
}
</script>

<style lang="scss">
.dashboard-background-setting {
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

  &--image {
    margin-top: 8px;
    margin-bottom: 16px;

    &--preview {
      width: 369px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      height: 40px;
      border: 1px solid #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      span {
        // limit text in 1 line
        display: -webkit-box;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      &--icon {
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        border-radius: 50%;

        &:hover {
          background-color: #fff3f3;
        }

        i {
          color: var(--danger);
        }
      }
    }

    &--upload {
      width: 141px;
    }
  }

  &--section {
    margin-bottom: 8px;
    &--title {
      font-size: 14px;
      display: block;
      font-style: normal;
      line-height: 132%;
      margin-bottom: 0;
    }
  }

  .fit-mode-setting {
    width: 246px;
    .dashboard-background-setting--section--title {
      margin-bottom: 8px;
    }

    .dashboard-background-setting--section--dropdown {
      margin-left: 1px;
    }
  }
}
</style>
