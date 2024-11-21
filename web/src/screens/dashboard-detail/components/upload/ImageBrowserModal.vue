<template>
  <div>
    <DiCustomModal ref="modal" id="image-browser-modal" :hide-header-close="false" @onClickOk="handleSubmit" @hidden="reset">
      <template #modal-header>
        <div class="custom-modal-header">
          <div class="header">
            <span>
              {{ modalTitle }}
            </span>
            <div aria-label="Close" class="close" type="button" @click.prevent="hide">
              <BIconX class="button-x btn-icon-border" />
            </div>
          </div>
          <div v-if="selectedMode.subtitle" class="subtitle">{{ selectedMode.subtitle }}</div>
          <div class="add-image-modes">
            <div
              v-for="mode in modes"
              :key="mode.id"
              class="add-image-modes--item"
              @click="handleSelectMode(mode)"
              :class="{ active: selectedMode.id === mode.id }"
            >
              {{ mode.displayName }}
            </div>
          </div>
        </div>
      </template>
      <div class="image-browser-container">
        <div class="image-browser-container--body">
          <div v-if="selectedMode.id === AddImageMode.Upload" class="image-browser-container--body--upload">
            <DiUpload ref="upload" @onBrowsedFile="handleBrowseImage"></DiUpload>
          </div>
          <div v-if="selectedMode.id === AddImageMode.Browse" class="image-browser-container--body--browse">
            <DiSearchInput
              class="image-browser-container--body--browse--search-input"
              ref="diSearchInput"
              v-model="keyword"
              autofocus
              :debounce="500"
              @change="keyword => handleSearchImages(keyword)"
              placeholder="Search stock images..."
            ></DiSearchInput>
            <div class="image-browser-container--body--browse--description">
              <span>Stock images are provided by Shutterstock. For more information visit</span>
              <a href="https://www.shutterstock.com/terms" target="_blank">&nbsp;Shutterstocks's Terms of Use & Privacy Policy</a> <span>and</span>
              <a href="https://www.shutterstock.com/terms" target="_blank">&nbsp;Licensing Terms</a>
            </div>
            <StatusWidget
              :status="status"
              :error="errorMessage"
              @retry="handleSearchImages(keyword, true)"
              class="image-browser-container--body--browse--results"
            >
              <template v-if="searchResult">
                <vuescroll>
                  <div class="image-browser-container--body--browse--results--container">
                    <div
                      v-for="imageInfo in searchResult"
                      :key="imageInfo.url"
                      class="image-browser-container--body--browse--results--container--item"
                      @click="handleSelectImage(imageInfo)"
                    >
                      <div class="image-browser-container--body--browse--results--container--item--overlay"></div>
                      <div
                        :class="{ active: isSelectedImage(imageInfo.url) }"
                        class="image-browser-container--body--browse--results--container--item--select "
                      ></div>
                      <img :src="imageInfo.previewUrl" alt="" />
                    </div>
                  </div>
                </vuescroll>
              </template>
              <template #empty>
                <EmptyWidget></EmptyWidget>
              </template>
            </StatusWidget>
          </div>
        </div>
      </div>
      <template #modal-footer="{ok}">
        <div class="w-100 d-flex justify-content-center align-items-center">
          <DiButton :disabled="isDisableSubmitButton" primary @click="ok">{{ submitTitle }}</DiButton>
        </div>
      </template>
    </DiCustomModal>
    <ImageEditorModal ref="imageEditorModal" />
    <LakeUploadData ref="uploadData" :isShowMinimize="false" :is-show-close-btn="false" />
  </div>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import { SelectOption, Status } from '@/shared';
import ImageEditorModal from '@/screens/dashboard-detail/components/upload/ImageEditorModal.vue';
import LakeUploadData from '@/screens/lake-house/components/lake-upload/LakeUploadData.vue';
import DiUpload from '@/screens/dashboard-detail/components/upload/DiUpload.vue';
import { DIException, ImageInfo } from '@core/common/domain';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Inject } from 'typescript-ioc';
import { ImageService } from '@core/common/services/ImageService';
import { BvEvent } from 'bootstrap-vue';
import { Log, UrlUtils } from '@core/utils';
import { ListUtils, TimeoutUtils } from '@/utils';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';
import { AtomicAction } from '@core/common/misc';

enum AddImageMode {
  Browse = 'browse',
  Upload = 'upload'
}

@Component({
  components: { StatusWidget, DiSearchInput, DiCustomModal, DiUpload, ImageEditorModal, LakeUploadData, EmptyWidget }
})
export default class ImageBrowserModal extends Vue {
  private readonly AddImageMode = AddImageMode;
  private readonly modes: DropdownData[] = [
    {
      id: AddImageMode.Upload,
      displayName: 'Upload Image',
      subtitle: ''
    },
    {
      id: AddImageMode.Browse,
      displayName: 'Browse Image',
      subtitle: ''
    }
  ];

  private selectedMode = this.modes[1];

  private keyword = '';
  private selectedImage: ImageInfo | null = null;
  private searchResult: ImageInfo[] = [];
  private status = Status.Loading;
  private errorMessage = '';
  private modalTitle = 'Insert Image';

  @Ref()
  private readonly modal!: DiCustomModal;

  @Ref()
  private readonly diSearchInput!: DiSearchInput;

  @Ref()
  private readonly imageEditorModal!: ImageEditorModal;

  @Ref()
  private readonly uploadData!: LakeUploadData;

  @Ref()
  private readonly upload?: DiUpload;

  @Inject
  private imageService!: ImageService;

  private callback: ((url: string) => void) | null = null;

  show(onUploaded: (url: string) => void, modalTitle?: string) {
    if (modalTitle) {
      this.modalTitle = modalTitle;
    }
    this.callback = onUploaded;
    if (this.isEmptyResult) {
      this.handleSearchImages(this.keyword, true);
    }

    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  private showUpdating() {
    this.status = Status.Updating;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showEmpty() {
    this.status = Status.Empty;
  }

  private hideLoading() {
    this.status = Status.Loaded;
  }

  private showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.message;
  }

  private get submitTitle() {
    switch (this.selectedMode.id) {
      case AddImageMode.Upload:
        return 'Upload';
      default:
        return 'Select';
    }
  }

  private get isDisableSubmitButton() {
    switch (this.selectedMode.id) {
      case AddImageMode.Browse:
        return this.selectedImage ? false : true;
      default:
        return false;
    }
  }

  private isSelectedImage(url: string) {
    return this.selectedImage?.url === url;
  }

  private handleBrowseImage(file: File) {
    this.hide();
    this.showImageEditorModal(file);
  }

  private async showImageEditorModal(file: File) {
    Log.debug('ImageBrowserModal::showImageEditorModal::imageEditorModal::', this.imageEditorModal);
    await this.imageEditorModal.show(file, blob => this.showUploadData(blob, file.name));
    this.selectedImage = null;
  }

  private async showUploadData(blob: Blob, fileName: string) {
    const file = new File([blob], `${fileName}`, { type: blob.type });
    await this.uploadData.startUpload(
      file,
      url => {
        this.callback?.call(this, url);
      },
      'Ok',
      true
    );
  }

  private reset() {
    this.selectedMode = this.modes[1];
    this.keyword = '';
    // this.selectedImage = null;
    this.upload?.reset();
  }

  private get isUploadMode() {
    return this.selectedMode.id === AddImageMode.Upload;
  }

  private async handleSubmit(e: BvEvent) {
    e.preventDefault();
    if (this.isUploadMode) {
      this.upload?.browserLocalFiles();
    } else {
      if (this.callback && this.selectedImage) {
        Log.debug('ImageBrowserModal::handleSubmit::selectedImage::', this.selectedImage);
        const blob = await this.imageService.getImageFile(this.selectedImage.url);
        const file = new File([blob], UrlUtils.getFileName(this.selectedImage.url), { type: blob.type });
        Log.debug('ImageBrowserModal::handleSubmit::file', file, this.imageEditorModal);
        await this.showImageEditorModal(file);
        this.$nextTick(() => {
          this.hide();
        });
      }
    }
  }

  private async handleSelectMode(mode: DropdownData) {
    this.selectedMode = mode;
    await TimeoutUtils.sleep(300);
    if (mode.id === AddImageMode.Upload) {
      this.upload?.focusUploadButton();
    }
  }

  private get isEmptyResult() {
    return ListUtils.isEmpty(this.searchResult);
  }

  @AtomicAction()
  private async handleSearchImages(keyword: string, force = false) {
    try {
      force ? this.showLoading() : this.showUpdating();
      this.searchResult = await this.imageService.search(keyword);
      this.hideLoading();
      this.selectedImage = null;
      if (this.isEmptyResult) {
        this.showEmpty();
      }
    } catch (e) {
      const ex = DIException.fromObject(e);
      this.showError(ex);
    }
  }

  private handleSelectImage(image: ImageInfo) {
    this.selectedImage = image;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

#image-browser-modal {
  .modal-dialog {
    max-width: 686px;
  }

  .modal-header {
    padding: 16px 0 0 0 !important;
  }

  .modal-body {
    padding: 0px !important;
  }

  .modal-footer {
    .di-button {
      width: 160px;
      border-radius: 8px;
    }
  }

  .custom-modal-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    margin-bottom: 24px;

    .header {
      width: 100%;
      display: flex;
      justify-content: center;

      span {
        @include medium-text(24px, 0.2px, 28px);
      }

      .close {
        position: absolute;
        right: 16px;
        top: 0;
      }
    }
    .subtitle {
      @include medium-text(16px, 0.2px, 18.75px);
      font-weight: 400;
      margin-top: 7px;
      text-align: center;
    }
    .add-image-modes {
      margin-top: 16px;
      display: flex;
      flex-direction: row;
      align-items: center;

      &--item {
        height: 48px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        flex: 1;
        border-bottom: 2px solid rgba(89, 127, 255, 0.1);
        @include medium-text(16px, 0.2px, 18.75px);
        font-weight: 400;

        &.active {
          border-bottom: 2px solid var(--accent);
          color: var(--accent);
        }
      }
    }
  }

  .image-browser-container {
    &--body {
      height: 418px;
      padding: 0 16px;
      &--browse {
        &--search-input {
          display: flex;
          margin-bottom: 16px;
          background: var(--input-background-color);
          height: 34px;
          width: 80%;
          margin-left: auto;
          margin-right: auto;
        }

        &--description {
          @include medium-text(16px, 0.2px, 18.75px);
          font-weight: 400;
          text-align: center;
          padding: 0 32px;
          a {
            color: var(--text-color);
            text-decoration: underline;
          }
        }

        &--results {
          height: 318px !important;
          margin-top: 12px;
          position: relative;

          &--container {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 10px;
            &--item {
              position: relative;
              box-sizing: border-box;
              width: 210px;
              height: 124px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              &--select {
                position: absolute;

                width: 210px;
                height: 124px;
                border: 1px solid transparent;
                &.active {
                  border: 1px solid var(--accent);
                }
              }

              &--overlay {
                width: 206px;
                height: 120px;
                position: absolute;
                z-index: 1;

                &:hover {
                  background: rgba(0, 0, 0, 0.1);
                }
              }
              img {
                object-fit: contain;
                width: 206px;
                height: 120px;
              }

              //&:hover{
              //  opacity: 0.1;
              //}
            }
          }
        }
      }
      &--upload {
        .di-upload-container {
          height: 418px;
        }
      }
    }
  }
}
</style>
