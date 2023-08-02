<template>
  <DiCustomModal
    ref="modal"
    title="Image Editor"
    size="xl"
    modalClass="image-editor-modal"
    @onClickOk="saveImage"
    hide-header-close
    :contentClass="contentModalClass"
    no-enforce-focus
    @hidden="reset()"
  >
    <div ref="imageEditorElement"></div>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import 'tui-image-editor/dist/svg/icon-a.svg';
import 'tui-image-editor/dist/svg/icon-b.svg';
import 'tui-image-editor/dist/svg/icon-c.svg';
import 'tui-image-editor/dist/svg/icon-d.svg';
import 'tui-image-editor/dist/tui-image-editor.css';
import 'tui-color-picker/dist/tui-color-picker.css';
import ImageEditor from 'tui-image-editor';
import { PopupUtils } from '@/utils';
import { Log } from '@core/utils';

@Component({ components: { DiCustomModal } })
export default class ImageEditorModal extends Vue {
  private readonly contentModalClass = 'image-editor-modal-content';
  private readonly theme = require('./white-theme.json');
  @Ref()
  private readonly modal!: DiCustomModal;

  @Ref()
  private readonly imageEditorElement!: HTMLElement;

  private callback: ((blob: Blob) => void) | null = null;

  private imageEditor: ImageEditor | null = null;

  private options = {
    usageStatistics: false,
    includeUI: {
      theme: this.theme,
      menuBarPosition: 'left'
    },
    cssMaxWidth: 700,
    cssMaxHeight: 500
  };

  async show(file: File, onSave: (blob: Blob) => void) {
    this.reset();
    this.callback = onSave;
    this.modal.show();
    this.$nextTick(async () => {
      await this.initEditor(file);
    });
    // this.imageEditor.res
  }

  private async initEditor(file: File) {
    this.imageEditor = new ImageEditor(this.imageEditorElement, this.options);
    await this.imageEditor.loadImageFromFile(file, file.name);
    // @ts-ignore
    this.imageEditor.ui.activeMenuEvent();
    // this.imageEditor.ui.
  }

  private async saveImage(event: MouseEvent) {
    try {
      event.preventDefault();
      this.modal.setLoading(true);
      const base64Image: string = this.imageEditor!.toDataURL(); //Return base64
      const res = await fetch(base64Image);
      const blob = await res.blob();
      this.callback ? this.callback(blob) : void 0;
      this.modal.setLoading(false);
      this.hide();
    } catch (ex) {
      PopupUtils.showError('Cannot upload image', ex);
      Log.error('Cannot upload image', ex);
      this.modal.setLoading(false);
    }
  }

  private hide() {
    this.$nextTick(() => {
      this.modal.hide();
    });
  }

  private reset() {
    this.modal.setLoading(false);
    this.callback = null;
    this.imageEditor ? this.imageEditor.destroy() : void 0;
    this.imageEditor = null;
  }
}
</script>

<style lang="scss">
.image-editor-modal {
  //height: 500px;
  .tui-image-editor-header {
    display: none !important;
  }

  .tui-image-editor-main {
    top: 0;
  }

  .tui-image-editor {
    border: 2px dashed rgba(0, 0, 0, 0.3);
    border-spacing: 3px;
  }

  //.tui-image-editor-help-menu {
  //  display: none;
  //}

  .tui-image-editor-controls {
    background: #fff;
  }

  .tui-image-editor-item.active {
    background: var(--accent);
  }

  .tui-image-editor-button {
    label {
      //cursor: pointer;
      vertical-align: unset !important;
    }
  }

  .modal-body {
    height: 60vh;
  }
}
</style>
