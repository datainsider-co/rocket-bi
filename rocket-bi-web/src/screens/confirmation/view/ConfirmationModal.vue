<template>
  <BModal
    ref="diCustomModal"
    id="confirmation-modal"
    title="Please Confirm"
    :no-close-on-esc="false"
    :hide-header="true"
    centered
    size="sm"
    @ok="handleClickOk"
    @cancel="handleCancel"
    auto-focus-button="ok"
    ok-title="Confirm"
    class="di-modal"
    @keypress.enter="handleClickOk"
  >
    <div class="slot-body d-flex flex-column text-center">
      <img class="confirmation-image" src="@/assets/icon/ic_exclamation.svg" alt="" />
      <div class="title">Please Confirm</div>
      <div class="message">{{ message }}</div>
    </div>
  </BModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';

export interface ModalCallback {
  onOk?: (event: MouseEvent) => void;
  onCancel?: (event: MouseEvent) => void;
}
@Component({
  components: {}
})
export default class ConfirmationModal extends Vue {
  private message = '';
  private modalCallback?: ModalCallback;

  @Ref()
  readonly diCustomModal?: BModal;

  show(message: string, modalCallback?: ModalCallback) {
    this.message = message;
    this.modalCallback = modalCallback;
    this.diCustomModal?.show();
  }

  private handleClickOk(event: MouseEvent) {
    if (this.modalCallback?.onOk) {
      this.modalCallback.onOk(event);
    }
  }

  private handleCancel(event: MouseEvent) {
    if (this.modalCallback?.onCancel) {
      this.modalCallback.onCancel(event);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

#confirmation-modal___BV_modal_outer_ {
  z-index: 9999999 !important;
}

#confirmation-modal {
  .slot-body {
    .confirmation-image {
      margin: 8px auto 12px;
      width: 48px;
      height: 48px;
    }
    .title {
      @include medium-text(16px, 0.4px, 1.5);
      margin-bottom: 8px;
    }
    .message {
      font-size: 16px;
      font-weight: normal;
      font-stretch: normal;
      font-style: normal;
      line-height: 1.5;
      letter-spacing: 0.4px;
      text-align: center;
      color: var(--secondary-text-color);
      margin-bottom: 2px;

      word-break: break-word;

      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;
      overflow: hidden;
      width: 100%;
    }
  }

  .modal-dialog {
    max-width: 398px;
  }
  .modal-footer > button {
    flex-basis: 0;
    flex-grow: 1;
    max-width: 100%;
    height: 42px;
  }
}
</style>
