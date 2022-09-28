<template>
  <BModal
    :id="id"
    ref="modal"
    :cancelTitle="cancelTitle"
    :okTitle="okTitle"
    :size="size"
    :hide-header-close="hideHeaderClose"
    centered
    :scrollable="scrollable"
    :no-close-on-esc="false"
    class="rounded"
    v-bind="$attrs"
    @ok="handleClickOk"
    :ok-disabled="okDisabled"
    @cancel="handleCancel"
    @hide="handleClose"
    @close="handleCancel"
    @hidden="handleHidden"
    :modal-class="modalClass"
    :dialog-class="dialogClass"
  >
    <template #modal-header="{ close }">
      <slot name="modal-header" :close="close">
        <div class="custom-header d-inline-flex w-100">
          <h6 class="modal-title cursor-default">
            <div>{{ title }}</div>
            <slot name="subtitle"></slot>
          </h6>
          <div v-if="!hideHeaderClose" aria-label="Close" class="close" type="button" @click.prevent="close()">
            <BIconX class="button-x btn-icon-border" />
          </div>
        </div>
      </slot>
    </template>
    <template #modal-footer="{ ok, cancel}">
      <slot name="modal-footer" :ok="ok" :cancel="cancel"></slot>
    </template>
    <template #default>
      <slot></slot>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { BModal, BvModalEvent } from 'bootstrap-vue';

@Component
export default class DiCustomModal extends Vue {
  @Prop({ type: String, default: 'custom-modal' })
  private id!: string;

  @Prop({ required: true, type: String })
  private title!: string;

  @Prop({ type: String, default: 'Cancel' })
  private cancelTitle!: string;

  @Prop({ type: String, default: 'Ok' })
  private okTitle!: string;

  @Prop({ type: String, default: 'lg' })
  private size!: 'sm' | 'md' | 'lg' | 'xl';

  @Prop({ type: String, required: false, default: '' })
  private readonly modalClass!: string;

  @Prop({ type: String, required: false, default: '' })
  private readonly dialogClass!: string;

  @Prop({ type: Boolean, required: false, default: false })
  private readonly hideHeaderClose!: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  private readonly okDisabled!: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  private readonly scrollable!: boolean;

  @Ref()
  private modal!: BModal;

  show() {
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  @Emit('onClickOk')
  private handleClickOk(bvModalEvt: MouseEvent) {
    return bvModalEvt;
  }

  @Emit('onCancel')
  private handleCancel(bvModalEvt: MouseEvent) {
    return bvModalEvt;
  }

  @Emit('hidden')
  private handleHidden(bvModalEvt: BvModalEvent) {
    return bvModalEvt;
  }

  @Emit('hide')
  handleClose(bvModalEvt: MouseEvent) {
    return bvModalEvt;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.custom-header {
  min-height: 28px;

  .modal-title {
    @include medium-text(24px, 0.2px, 1.17);
  }

  .button-x {
    width: 24px;
    height: 24px;
    color: var(--text-color);
  }
}

::v-deep {
  .modal-footer > button {
    flex-basis: 0;
    flex-grow: 1;
    max-width: 100%;
    height: 42px;
  }
}
</style>

<style lang="scss">
.modal-small {
  max-width: 350px !important;

  .modal-header {
    padding: 12px 24px 0 24px !important;
  }

  .modal-body {
    padding: 24px !important;
  }

  .modal-footer {
    padding: 0 24px 24px 24px !important;
  }
}
</style>
