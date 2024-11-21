<template>
  <div>
    <div v-if="backgroundRunning" class="upload-data-minimize">
      <a @click.prevent="maximize" href="#">
        <span v-if="success">Upload success</span>
        <span v-else-if="fail">Upload failed</span>
        <span v-else> Uploading... ({{ percentCompleted }}) </span>
      </a>
    </div>
    <Modal ref="uploadModal" hide-footer backdrop="static" :keyboard="false" :width="610" title="Upload data" show-at-body>
      <template #header-action>
        <button @click.prevent="minimize" aria-label="Close" class="close minimize" type="button" v-if="isShowMinimize">
          <span aria-hidden="true">-</span>
        </button>
        <button v-if="isShowCloseBtn" @click.prevent="close" aria-label="Close" class="close" type="button">
          <span aria-hidden="true">&times;</span>
        </button>
      </template>
      <div class="my-3">
        <div class="d-flex justify-content-between mb-2">
          <span>
            <img src="../../assets/csv.svg" alt="" width="16" height="16" />
            {{ fileName }}
          </span>
          <span>{{ percentCompleted }}%</span>
        </div>
        <div class="progress progress-di">
          <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" :style="{ width: `${percentCompleted}%` }"></div>
        </div>
        <div v-if="success" class="mt-3">
          <div class="text-center">
            <DiButton @click="handleUploadSuccess" primary :title="okTitle" style="min-width: 168px;width: fit-content;height: 32px" class="mx-auto"></DiButton>
          </div>
        </div>
        <template v-if="isStopped && fail">
          <div class="mt-3">
            <div class="text-muted mb-2 text-danger">
              <small class="text-danger"> Upload file failed </small> <br />
              <small class="text-danger">{{ error }}</small>
            </div>
            <div class="text-center">
              <DiButton
                :is-disable="loading"
                @click.prevent="reUpload"
                title="Retry"
                primary
                style="min-width: 168px;width: fit-content;height: 32px"
                class="mx-auto"
              ></DiButton>
            </div>
          </div>
        </template>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Prop } from 'vue-property-decorator';
import Modal from '@/shared/components/common/Modal.vue';
import { Inject } from 'typescript-ioc';
import { Log, UrlUtils } from '@core/utils';
import { RouterUtils } from '@/utils/RouterUtils';
import { UploadType } from '@/screens/lake-house/components/lake-upload/UploadType';
import { UploadService } from '@core/common/services';
import { DIException } from '@core/common/domain';
import { TimeoutUtils } from '@/utils';
import { AtomicAction } from '@core/common/misc';

@Component({ components: { Modal } })
export default class LakeUploadData extends Vue {
  isStopped = false;
  backgroundRunning = false;
  loading = false;
  done = false;
  success = false;
  fail = false;
  percentCompleted = 0;
  error = '';

  file: File | null = null;
  path = ''; ///Using for lake upload
  urlImage = ''; ////Using for normal upload
  uploadType: UploadType = UploadType.Lake;
  private okTitle = 'View Data';
  @Ref()
  //@ts-ignore
  private readonly uploadModal!: Modal;

  @Inject
  private readonly uploadService!: UploadService;

  @Prop({ type: Boolean, default: true })
  private readonly isShowMinimize!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly isShowCloseBtn!: boolean;

  private callback: ((path: string) => void) | null = null;

  @AtomicAction()
  async startUpload(file: File, onUploaded: (path: string) => void, okTitle = 'Ok', skipConfirmOk = false): Promise<void> {
    try {
      this.reset();
      this.file = file;
      this.uploadType = UploadType.Default;
      this.callback = onUploaded;
      this.okTitle = okTitle;
      this.maximize();
      this.path = await this.uploadDefault(file);
      this.success = true;
      this.fail = false;
    } catch (ex) {
      Log.error(ex);
      this.fail = true;
      this.success = false;
      this.error = ex.message;
    } finally {
      this.isStopped = true;
      this.done = true;
      this.loading = false;
    }

    if (skipConfirmOk && this.success) {
      // trick to avoid variable not updated
      await TimeoutUtils.sleep(200);
      await this.handleUploadSuccess();
    }
  }
  private async uploadDefault(file: File): Promise<string> {
    const response = await this.uploadService.updateFromFile(file, progressEvent => {
      this.percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    });
    if (response.success) {
      return response.data;
    } else {
      Log.error('error:: response', response);
      throw new DIException('Upload Failed!');
    }
  }

  reUpload() {
    if (this.file) {
      switch (this.uploadType) {
        case UploadType.Default:
          return this.startUpload(this.file, this.callback!);
      }
    }
  }

  reset() {
    this.isStopped = false;
    this.loading = true;
    this.done = false;
    this.uploadType = UploadType.Lake;
    this.callback = null;
    this.path = '';
    this.urlImage = '';
    this.percentCompleted = 0;
  }

  show() {
    this.$nextTick(() => {
      this.uploadModal.show();
    });
  }

  minimize() {
    this.backgroundRunning = true;
    this.uploadModal.hide();
  }

  maximize() {
    this.backgroundRunning = false;
    this.show();
  }

  stop() {
    this.isStopped = true;
  }

  async close() {
    if (!this.done && !this.isStopped) {
      //@ts-ignore
      const { isConfirmed } = await this.$alert.fire({
        icon: 'warning',
        title: 'Uploading progress has not finished yet!',
        html: 'Do you want to stop uploading?',
        confirmButtonText: 'Yes',
        showCancelButton: true,
        cancelButtonText: 'No'
      });
      if (isConfirmed) {
        this.stop();
      }
      return;
    }
    this.uploadModal.hide();
    this.reset();
  }

  @AtomicAction()
  private async handleUploadSuccess(): Promise<void> {
    const finalPath = this.getPath(this.uploadType);
    this.callback ? this.callback(finalPath) : void 0;
    await this.close();
  }

  private getPath(type: UploadType) {
    switch (type) {
      case UploadType.Lake:
        return RouterUtils.getAbsolutePath(RouterUtils.normalizePath(`${this.path}/${this.file?.name}`));
      case UploadType.Default:
        return UrlUtils.getStaticImageUrl(this.path);
    }
  }
  private get fileName(): string {
    return this.file?.name ?? '';
  }
}
</script>
