<template>
  <BModal
    v-model="isShowSync"
    class="position-relative"
    :ok-title="okTitle"
    centered
    size="md"
    :ok-disabled="okDisable"
    :hide-header="true"
    @ok="handleClickOk"
    @cancel="handleCancel"
    @show="onShowModal"
  >
    <img class="btn-close btn-ghost position-absolute" src="@/assets/icon/ic_close.svg" alt="" @click="closeModal" />
    <div class="modal-title text-center">{{ title }}</div>
    <div class="modal-sub-title text-center">{{ subTitle }}</div>
    <div class="item d-flex w-100 justify-content-center align-items-center">
      <slot></slot>
    </div>
    <template #modal-footer="{ok, cancel}">
      <div class="custom-footer d-flex col-12 p-0">
        <DiButton id="button-test-connection" class="button-test btn-secondary w-50" title="Cancel" @click="cancel"> </DiButton>
        <DiButton id="button-submit" :disabled="okDisable" class="button-add btn-primary w-50" :title="okTitle" @click="ok"> </DiButton>
      </div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Vue, Component, PropSync, Prop } from 'vue-property-decorator';
@Component
export default class DiCustomCenterModal extends Vue {
  @PropSync('isShow', { type: Boolean })
  isShowSync!: boolean;

  @Prop({ default: '', type: String })
  title!: string;

  @Prop({ default: '', type: String })
  subTitle!: string;

  @Prop({ default: 'OK', type: String })
  okTitle!: string;

  @Prop({ default: false })
  okDisable!: boolean;

  private closeModal() {
    this.isShowSync = false;
  }

  private handleClickOk(e: MouseEvent) {
    this.$emit('ok', e);
  }

  private onShowModal() {
    this.$emit('show');
  }

  private handleCancel(e: MouseEvent) {
    this.$emit('cancel', e);
  }
}
</script>

<style lang="scss" scoped>
.modal-title {
  font-size: 16px;
  padding: 10px 25px 8px 25px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  font-weight: 500;
  color: var(--text-color);
}
.modal-sub-title {
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  padding-bottom: 32px;
  color: var(--secondary-text-color);
}

.btn-close {
  top: 12px;
  right: 12px;
  .title {
    width: 0;
  }
}

::v-deep {
  .custom-footer {
    margin: 0;
  }
  .modal-footer {
    display: flex;
    width: 100%;

    padding-left: 16px;
    padding-right: 16px;
    margin: auto;

    .button-test {
      height: 42px;
      color: var(--accent);
      justify-content: center;
      .title {
        width: fit-content;
      }
      margin-right: 6px;
    }
    .button-add {
      height: 42px;
    }
  }
}
</style>
