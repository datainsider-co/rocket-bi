<template>
  <div>
    <ImageBrowserFileModal ref="browseFileModal" />
    <ImageEditorModal ref="imageEditorModal" />
    <LakeUploadData ref="uploadData" :isShowMinimize="false" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator';
import ImageEditorModal from './ImageEditorModal.vue';
import ImageBrowserFileModal from './ImageBrowserFileModal.vue';
import LakeUploadData from '@/screens/lake-house/components/lake-upload/LakeUploadData.vue';

@Component({ components: { LakeUploadData, ImageBrowserFileModal, ImageEditorModal } })
export default class UploadImageComponent extends Vue {
  @Ref()
  private readonly browseFileModal!: ImageBrowserFileModal;

  @Ref()
  private readonly imageEditorModal!: ImageEditorModal;

  @Ref()
  private readonly uploadData!: LakeUploadData;

  private callback: ((url: string) => void) | null = null;

  show(onUploaded: (url: string) => void) {
    this.reset();
    this.callback = onUploaded;
    this.browseFileModal.show(this.showImageEditorModal);
  }

  private async showImageEditorModal(file: File) {
    await this.imageEditorModal.show(file, blob => this.showUploadData(blob, file.name));
  }

  private reset() {
    this.callback = null;
  }

  private async showUploadData(blob: Blob, fileName: string) {
    const file = new File([blob], `${fileName}`, { type: blob.type });
    await this.uploadData.startUpload(
      file,
      url => {
        this.callback?.call(this, url);
      },
      'Ok'
    );
  }
}
</script>
