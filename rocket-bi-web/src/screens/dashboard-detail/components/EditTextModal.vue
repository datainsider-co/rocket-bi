<template>
  <EtlModal
    builder-default-style
    id="edit-text-modal"
    ref="editTextModal"
    :width="1068"
    borderCancel
    centered
    actionName="Save"
    title="Add text"
    @submit="handleClickOk"
    @hidden="reset"
  >
    <PreviewText ref="previewText" />
  </EtlModal>
</template>

<script lang="ts">
import { Vue, Component, Ref } from 'vue-property-decorator';
import { TextWidget } from '@core/common/domain/model';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import PreviewText from '@/screens/dashboard-detail/components/PreviewText.vue';
import { Log } from '@core/utils';

@Component({
  components: { EtlModal, PreviewText }
})
export default class EditTextModal extends Vue {
  textWidget = TextWidget.empty();
  isEdit = false;

  $refs!: {
    editTextModal: any;
  };

  @Ref()
  private previewText!: PreviewText;

  show(textWidget: TextWidget, isEdit: boolean) {
    this.textWidget = textWidget;
    this.isEdit = isEdit;
    this.$refs.editTextModal.show();
    this.previewText.init(textWidget);
  }

  protected reset() {
    Log.debug('EditTextModal::reset::');
    this.isEdit = false;
    this.textWidget = TextWidget.empty();
  }

  hide() {
    this.$refs.editTextModal.hide();
  }

  handleClickOk(): void {
    const textWidget = this.previewText.textWidget;
    if (this.isEdit) {
      this.$emit('onEditText', textWidget);
    } else {
      this.$emit('onCreateText', textWidget);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';

#edit-text-modal {
  .modal-content {
    .modal-header {
      .cancel-button {
        color: var(--accent) !important;
        &[border] {
          border: 1px solid var(--accent) !important;
        }
        min-width: 80px;
        height: 26px;
      }

      .submit-button {
        min-width: 80px;
        height: 26px;
      }
    }
  }
}
</style>
