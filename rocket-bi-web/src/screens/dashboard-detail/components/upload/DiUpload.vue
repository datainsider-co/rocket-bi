<template>
  <div class=" di-upload-container" :class="{ dragover: isDragOver, 'has-error': error }" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <input @change="onChangeFile" ref="file" type="file" class="d-none" accept="image/png, image/jpeg" />
    <div class="upload-body d-flex flex-column text-center w-100 h-100 justify-content-center">
      <img class="mx-auto mb-4 di-icon-upload" style="font-size: 40px" src="@/assets/icon/upload.svg" />
      <div>DRAG AND DROP FILE</div>
      <div>Drop a document or</div>
      <a ref="browseFileButton" @click.prevent="browserLocalFiles" href="#" class="color-di-primary">browse your file</a>
      <div class="text-danger mt-2">
        {{ error }}
        <span>&nbsp;</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch, Ref } from 'vue-property-decorator';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Log } from '@core/utils';

@Component
export default class DiUpload extends Vue {
  isDragOver = false;
  files: File[] = [];
  path = '';
  loading = false;
  error = '';

  @Ref()
  private readonly file!: HTMLInputElement;

  @Ref()
  private readonly browseFileButton!: HTMLAnchorElement;

  public reset() {
    this.isDragOver = false;
    this.files = [];
  }

  focusUploadButton() {
    this.browseFileButton.focus();
  }

  browserLocalFiles() {
    this.file.value = '';
    this.file.click();
  }

  onChangeFile(e: any) {
    const files = [];
    for (let i = 0; i < e.target?.files?.length; i++) {
      files.push(e.target.files[0]);
    }
    this.files = files;
    TrackingUtils.track(TrackEvents.SelectFilePath, {
      fileName: files[0]?.name ?? 'unknown',
      fileType: files[0].type ?? 'unknown'
    });
  }

  onDragOver(e: MouseEvent) {
    this.isDragOver = true;
    e.preventDefault();
  }

  onDragLeave(e: MouseEvent) {
    Log.debug('onDragOver', e);
    this.isDragOver = false;
  }

  onDrop(e: any) {
    e.preventDefault();
    this.isDragOver = false;
    const files = [];
    if (e.dataTransfer.items) {
      Log.debug('e.dataTransfer.items');
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (e.dataTransfer.items[i].kind === 'file') {
          files.push(e.dataTransfer.items[i].getAsFile());
        }
      }
    } else {
      Log.debug('e.dataTransfer.files');
      // Use DataTransfer interface to access the file(s)
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i]);
      }
    }
    this.files = files;
    TrackingUtils.track(TrackEvents.SelectFilePath, {
      fileName: files[0]?.name ?? 'unknown',
      fileType: files[0].type ?? 'unknown'
    });
  }

  @Watch('files')
  async onFilesChanged() {
    if (this.files.length > 1) {
      this.error = 'Too many files! Please drag only one file!';
      this.files = [];
    } else if (this.files[0] && this.files[0].size <= 0) {
      this.error = 'Your file is empty. Please choose another file!';
      this.files = [];
    } else if (this.files[0]) {
      this.error = '';
      Log.debug('onFilesChanged::', this.files[0]);
      this.$emit('onBrowsedFile', this.files[0]);
    }
    this.files.forEach((file, i) => Log.debug('... file[' + i + '].name = ' + file.name));
  }
}
</script>

<style lang="scss">
.di-upload-container {
  border-radius: 4px;
  /*border: 2px dashed #484a54;*/
  width: 100%;
  height: 400px;
  overflow: hidden;
  /*margin-top: 24px;*/
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23333' stroke-width='2' stroke-dasharray='5%2c 4' stroke-dashoffset='0' stroke-linecap='butt'/%3e%3c/svg%3e");
}

.di-upload-container .upload-body {
  /*background-color: var(--hover-color);*/
  text-decoration: none;
}

/*.di-upload-container:hover, */
.di-upload-container.dragover {
  border-color: #567afb;
}

.di-upload-container.has-error {
  border-color: var(--danger);
}

/*.di-upload-container:hover .upload-body,*/
.di-upload-container.dragover .upload-body {
  background-color: rgba(86, 122, 251, 0.11);
}
</style>
