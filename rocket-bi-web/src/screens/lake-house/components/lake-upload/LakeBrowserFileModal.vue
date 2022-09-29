<template>
  <div class="di-theme">
    <Modal ref="modal" hide-footer width="648" backdrop="static" :keyboard="false" disable-scroll-h>
      <template #header>
        <div class="w-100 text-center">
          <h5 class="modal-title">Add New Data</h5>
          <div class="text-muted">Upload a file</div>
        </div>
      </template>
      <div class="upload-container" :class="{ dragover: isDragOver, 'has-error': error }" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
        <input @change="onChangeFile" ref="file" type="file" class="d-none" />
        <div class="upload-body d-flex flex-column text-center w-100 h-100 justify-content-center">
          <img class="mx-auto mb-4" src="../../assets/upload.svg" alt="Upload Icon" width="40" height="40" />
          <div>DRAG AND DROP FILE</div>
          <div>Drop a document or</div>
          <a @click.prevent="browserLocalFiles" href="#" class="color-di-primary">browse your file</a>
          <div class="text-danger mt-2">
            {{ error }}
            <span>&nbsp;</span>
          </div>
        </div>
      </div>
    </Modal>
    <LakeUploadData ref="uploadModal"></LakeUploadData>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref, Watch } from 'vue-property-decorator';
import Modal from '@/screens/data-ingestion/components/di-upload-document/components/commons/Modal.vue';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import LakeUploadData from '@/screens/lake-house/components/lake-upload/LakeUploadData.vue';
import { CheckNameRequest, FileBrowserService } from '@core/lake-house';
import { Inject } from 'typescript-ioc';

@Component({ components: { Modal, LakeUploadData } })
export default class LakeBrowserFileModal extends Vue {
  @Ref()
  private readonly file!: HTMLInputElement;
  @Ref()
  //@ts-ignore
  private readonly modal!: Modal;
  @Ref()
  private readonly uploadModal!: LakeUploadData;

  @Inject
  private readonly fileBrowserService!: FileBrowserService;

  isDragOver = false;
  files: File[] = [];
  path = '';
  loading = false;
  error = '';

  reset() {
    this.isDragOver = false;
    this.files = [];
  }

  show(path: string) {
    this.reset();
    this.path = path;
    this.modal.show();
  }

  onDragOver(e: MouseEvent) {
    this.isDragOver = true;
    e.preventDefault();
  }

  onDragLeave(e: MouseEvent) {
    Log.debug('onDragOver', e);
    this.isDragOver = false;
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
      this.modal.hide();
      this.uploadModal.show();
      this.uploadModal.startUpload(this.files[0], this.path);
    }
    this.files.forEach((file, i) => Log.debug('... file[' + i + '].name = ' + file.name));
  }
}
</script>

<style lang="scss" scoped></style>
