<template>
  <BModal
    :id="id"
    ref="modal"
    :hide-header-close="true"
    no-close-on-esc
    :size="size"
    :title="title"
    auto-focus-button="ok"
    no-close-on-backdrop
    centered
    class="rounded"
    footer-class="condition-formatting-footer"
    modal-class="condition-formatting-modal"
    header-class="condition-formatting-header"
    body-class="condition-formatting-body"
    @cancel="handleCancelClicked"
    @ok="handleOkClicked"
  >
    <template #default>
      <vuescroll class="conditional-formatting-scroller">
        <slot></slot>
      </vuescroll>
    </template>
  </BModal>
</template>
<script lang="ts">
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { ModalCallback } from '@/screens/Confirmation/view/ConfirmationModal.vue';

export enum ConditionalModalSize {
  Large = 'lg',
  Small = 'sm'
}

@Component({
  components: { DiCustomModal }
})
export default class ConditionalFormattingModal extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;

  @Prop({ required: true, type: String })
  private readonly title!: string;

  @Prop({ required: false, type: String, default: ConditionalModalSize.Large })
  private readonly size!: ConditionalModalSize;

  @Ref()
  private readonly modal?: DiCustomModal;

  private callback: ModalCallback = {};

  public show(callback: ModalCallback | null | undefined = null) {
    this.modal?.show();
    this.callback = callback ?? {};
  }

  public hide() {
    this.modal?.hide();
  }

  private handleCancelClicked(event: MouseEvent) {
    if (this.callback.onCancel) {
      this.callback.onCancel(event);
    }
  }

  private handleOkClicked(event: MouseEvent) {
    if (this.callback.onOk) {
      this.callback.onOk(event);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.condition-formatting-modal {
  .condition-formatting-header {
    padding-top: 16px !important;
    padding-left: 24px !important;
    padding-right: 24px !important;
    h5 {
      display: inline-block;
      @include medium-text(24px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .condition-formatting-body {
    position: relative;
    height: 475px;
    padding: 24px !important;
    overflow: auto;

    > .conditional-formatting-scroller {
      position: initial !important;
    }
  }

  .condition-formatting-footer {
    border-top: none !important;
    padding: 0 24px 16px 24px !important;
    button {
      min-width: 64px;
      height: 26px;
      padding: 0;
    }
  }
}

.condition-formatting-modal .modal-lg {
  max-width: 808px;
}

.condition-formatting-modal .modal-sm {
  max-width: 360px;

  .condition-formatting-body {
    height: 375px;
  }
}
</style>
