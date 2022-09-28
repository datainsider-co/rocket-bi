<template>
  <div>
    <div v-if="backgroundRunning" class="upload-data-minimize">
      <a @click.prevent="maximize" href="#">
        <span v-if="success">Upload success</span>
        <span v-else-if="fail">Upload failed</span>
        <span v-else> Uploading... ({{ percentCompleted }}) </span>
      </a>
    </div>
    <Modal ref="uploadModal" hide-footer backdrop="static" :keyboard="false" :width="610">
      <template slot="header-action">
        <button @click.prevent="minimize" aria-label="Close" class="close minimize" type="button">
          <span aria-hidden="true">-</span>
        </button>
        <button @click.prevent="close" aria-label="Close" class="close" type="button">
          <span aria-hidden="true">&times;</span>
        </button>
      </template>
      <template slot="header">
        <div class="w-100">
          <h5 class="modal-title text-left">Upload data</h5>
          <div class="modal-desc">
            <span v-if="success" class="text-success">Success</span>
            <span v-else-if="fail" class="text-danger">Failed</span>
            <span v-else>Importing data to server</span>
          </div>
        </div>
      </template>
      <div class="my-4">
        <div class="d-flex justify-content-between mb-2">
          <span>
            <img src="../../assets/csv.svg" alt="" width="16" height="16" />
            {{ file.name }}
          </span>
          <span>{{ percentCompleted }}%</span>
        </div>
        <div class="progress progress-di">
          <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" :style="{ width: `${percentCompleted}%` }"></div>
        </div>
        <div v-if="success" class="mt-4">
          <div class="text-center">
            <button @click="handleUploadSuccess" class="btn btn-di-primary">View data</button>
          </div>
        </div>
        <template v-if="isStopped && fail">
          <div class="mt-2">
            <p class="text-muted text-danger">
              <small>Error when uploading file!</small> <br />
              <small>{{ error }}</small>
            </p>
            <div class="text-center">
              <button :disabled="loading" @click.prevent="reUpload" class="btn btn-di-primary">Re Upload</button>
            </div>
          </div>
        </template>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator';
import Modal from '@/screens/DataIngestion/components/DiUploadDocument/components/commons/Modal.vue';
import { Inject } from 'typescript-ioc';
import { FileBrowserService } from '@core/LakeHouse';
import { Log } from '@core/utils';
import { LakeExplorerModule } from '@/screens/LakeHouse/store/LakeExplorerStore';
import { RouterUtils } from '@/utils/RouterUtils';
import { Routers } from '@/shared';

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
  path = '';

  @Ref()
  //@ts-ignore
  private readonly uploadModal!: Modal;

  @Inject
  private readonly fileBrowserService!: FileBrowserService;

  async startUpload(file: File, path: string) {
    try {
      this.reset();
      this.file = file;
      this.path = path;
      // const existRes = await this.fileBrowserService.checkExist(new CheckNameRequest(path, [file.name]));
      await this.fileBrowserService.upload(path, file, file.name, true, progressEvent => {
        this.percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      });
      //Reload listing
      const response = await this.fileBrowserService.getPathFullInfo(RouterUtils.normalizePath(`${this.path}/${this.file?.name}`));
      LakeExplorerModule.updateListingOnCreateNew(response.data);
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
  }

  reUpload() {
    if (this.file && this.path) {
      this.startUpload(this.file, this.path);
    }
  }

  reset() {
    this.isStopped = false;
    this.loading = true;
    this.done = false;
  }

  show() {
    Log.error('LakeUploadData.show', this.uploadModal);
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

  private async handleUploadSuccess() {
    await this.close();
    const absolutePath = RouterUtils.getAbsolutePath(RouterUtils.normalizePath(`${this.path}/${this.file?.name}`));
    RouterUtils.to(Routers.LakeExplorer, { query: { path: absolutePath } });
  }
}
</script>

<style lang="scss" scoped></style>
