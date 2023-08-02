<template>
  <div class="di-theme">
    <Modal ref="modal" hide-footer :width="648" backdrop="static" :keyboard="false" disable-scroll-h>
      <template #header>
        <div class="w-100 text-center">
          <h5 class="modal-title">Add New Image</h5>
          <div class="text-muted">Upload a file</div>
        </div>
      </template>
      <DiUpload ref="upload" @onBrowsedFile="handleFileBrowsed"></DiUpload>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref, Watch } from 'vue-property-decorator';
import Modal from '@/shared/components/common/Modal.vue';
import DiUpload from '@/screens/dashboard-detail/components/upload/DiUpload.vue';

@Component({ components: { Modal, DiUpload } })
export default class ImageBrowserFileModal extends Vue {
  onBrowsedFile: ((file: File) => void) | null = null;

  @Ref()
  //@ts-ignore
  private readonly modal!: Modal;
  @Ref()
  private upload!: DiUpload;

  reset() {
    this.upload.reset();
  }

  show(onBrowsedFile: (file: File) => void) {
    this.reset();
    this.onBrowsedFile = onBrowsedFile;
  }

  private handleFileBrowsed(file: File) {
    this.onBrowsedFile ? this.onBrowsedFile(file) : void 0;
    this.modal.hide();
  }
}
</script>
